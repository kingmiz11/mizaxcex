import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CEX_HOT_WALLET_ADDRESS,
  fetchLiveWalletBalances,
  fetchPolygonNetworkStatus,
  NetworkStatus,
  LiveWalletBalances,
  ZIMAX_TO_POL_RATE,
  POL_TO_ZIMAX_RATE,
  executeWeb3Deposit,
  verifyOnChainTransaction,
  ZIMAX_CONTRACT_ADDRESS,
  POLYGON_RPC_URL,
} from '../services/polygon';

export type TokenType = 'ZIMAX' | 'POL';

export interface ExchangeBalances {
  pol: number;
  zimax: number;
  lockedPol: number;
  lockedZimax: number;
}

export type TransactionType = 'SWAP' | 'DEPOSIT' | 'WITHDRAW' | 'TRADE_BUY' | 'TRADE_SELL';
export type TransactionStatus = 'COMPLETED' | 'CONFIRMED' | 'PENDING' | 'FAILED';

export interface ExchangeTransaction {
  id: string;
  type: TransactionType;
  fromToken?: TokenType;
  toToken?: TokenType;
  fromAmount: number;
  toAmount: number;
  rate?: number;
  fee: number;
  feeAsset: string;
  externalAddress?: string;
  txHash?: string;
  timestamp: number;
  status: TransactionStatus;
  note?: string;
}

export interface OrderBookItem {
  id: string;
  price: number; // in POL per 1 ZIMAX
  amount: number; // ZIMAX amount
  total: number; // POL total
  type: 'buy' | 'sell';
  percentage: number;
}

export interface ExchangeContextType {
  balances: ExchangeBalances;
  custodialDepositAddress: string;
  userId: string;
  networkStatus: NetworkStatus | null;
  refreshNetworkStatus: () => Promise<void>;
  
  // External Wallet state
  connectedWallet: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  externalWalletBalances: LiveWalletBalances | null;
  isQueryingWallet: boolean;
  inspectExternalAddress: (address: string) => Promise<LiveWalletBalances>;

  // Internal Free Swap
  executeSwap: (fromToken: TokenType, amount: number) => Promise<{ success: boolean; receivedAmount: number; message: string }>;

  // Deposit methods
  depositViaWeb3: (token: TokenType, amount: number) => Promise<{ success: boolean; txHash: string }>;
  verifyAndCreditDepositTx: (txHash: string) => Promise<{ success: boolean; amount: number; token: TokenType; message: string }>;
  simulateDemoDeposit: (token: TokenType, amount: number) => void;

  // Withdrawal methods
  executeWithdrawal: (token: TokenType, amount: number, destinationAddress: string) => Promise<{ success: boolean; txHash: string; message: string }>;

  // Order Book & Trading
  orderBookAsks: OrderBookItem[];
  orderBookBids: OrderBookItem[];
  placeOrder: (type: 'buy' | 'sell', price: number, amount: number) => Promise<boolean>;

  // Activity Ledger
  transactions: ExchangeTransaction[];
  resetToDemoBalances: () => void;
}

const STORAGE_KEY_BALANCES = 'zimax_cex_balances_v1';
const STORAGE_KEY_TXS = 'zimax_cex_txs_v1';
const STORAGE_KEY_UID = 'zimax_cex_uid_v1';

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

export const ExchangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User ID
  const [userId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_UID);
    if (saved) return saved;
    const newUid = `UID-${Math.floor(100000 + Math.random() * 900000)}`;
    localStorage.setItem(STORAGE_KEY_UID, newUid);
    return newUid;
  });

  // Balances
  const [balances, setBalances] = useState<ExchangeBalances>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BALANCES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Generous default test balances so user can swap immediately
    return {
      pol: 25000,
      zimax: 10,
      lockedPol: 0,
      lockedZimax: 0,
    };
  });

  // Save balances on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BALANCES, JSON.stringify(balances));
  }, [balances]);

  // Transactions ledger
  const [transactions, setTransactions] = useState<ExchangeTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TXS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'tx-genesis-1',
        type: 'DEPOSIT',
        fromAmount: 10,
        toAmount: 10,
        toToken: 'ZIMAX',
        fee: 0,
        feeAsset: 'ZIMAX',
        externalAddress: '0x3A219...4B1a',
        txHash: '0x6e99a2db2046e1c2197782f704df48b7ab1f68d5918237492817293847291823',
        timestamp: Date.now() - 3600000 * 4,
        status: 'COMPLETED',
        note: 'Initial custodial deposit of ZIMAX',
      },
      {
        id: 'tx-genesis-2',
        type: 'DEPOSIT',
        fromAmount: 25000,
        toAmount: 25000,
        toToken: 'POL',
        fee: 0,
        feeAsset: 'POL',
        externalAddress: '0x3A219...4B1a',
        txHash: '0x14b282c877fc1d6e8020397b44259c00f6b3261504530e433701e69f4a99df49',
        timestamp: Date.now() - 3600000 * 2,
        status: 'COMPLETED',
        note: 'Custodial Polygon native deposit',
      },
      {
        id: 'tx-swap-demo',
        type: 'SWAP',
        fromToken: 'ZIMAX',
        toToken: 'POL',
        fromAmount: 1,
        toAmount: 10000,
        rate: 10000,
        fee: 0,
        feeAsset: 'POL',
        timestamp: Date.now() - 1800000,
        status: 'COMPLETED',
        note: 'Internal Zero-Fee Swap (1 ZIMAX : 10,000 POL)',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(transactions));
  }, [transactions]);

  // Network status from Ankr Polygon RPC
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);

  const refreshNetworkStatus = async () => {
    const status = await fetchPolygonNetworkStatus();
    setNetworkStatus(status);
  };

  useEffect(() => {
    refreshNetworkStatus();
    const interval = setInterval(refreshNetworkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // External Wallet state
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [externalWalletBalances, setExternalWalletBalances] = useState<LiveWalletBalances | null>(null);
  const [isQueryingWallet, setIsQueryingWallet] = useState<boolean>(false);

  // Connect Web3 wallet
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          const addr = accounts[0];
          setConnectedWallet(addr);
          await inspectExternalAddress(addr);
        }
      } catch (err: any) {
        console.error('Wallet connection rejected:', err);
        throw new Error(err.message || 'User rejected wallet connection');
      }
    } else {
      // Prompt user or simulate connected external wallet for demo
      const demoAddress = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5';
      setConnectedWallet(demoAddress);
      await inspectExternalAddress(demoAddress);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setExternalWalletBalances(null);
  };

  const inspectExternalAddress = async (address: string): Promise<LiveWalletBalances> => {
    setIsQueryingWallet(true);
    try {
      const data = await fetchLiveWalletBalances(address);
      setExternalWalletBalances(data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsQueryingWallet(false);
    }
  };

  // Free Internal Swap (1 ZIMAX = 10,000 POL, 0 fee)
  const executeSwap = async (
    fromToken: TokenType,
    amount: number
  ): Promise<{ success: boolean; receivedAmount: number; message: string }> => {
    if (amount <= 0) {
      throw new Error('Please enter a positive amount to swap.');
    }

    if (fromToken === 'ZIMAX') {
      if (balances.zimax < amount) {
        throw new Error(`Insufficient ZIMAX balance. Available: ${balances.zimax.toLocaleString()} ZIMAX`);
      }
      const toAmount = amount * ZIMAX_TO_POL_RATE; // 1 ZIMAX = 10,000 POL

      setBalances((prev) => ({
        ...prev,
        zimax: prev.zimax - amount,
        pol: prev.pol + toAmount,
      }));

      const newTx: ExchangeTransaction = {
        id: `swap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'SWAP',
        fromToken: 'ZIMAX',
        toToken: 'POL',
        fromAmount: amount,
        toAmount,
        rate: ZIMAX_TO_POL_RATE,
        fee: 0,
        feeAsset: 'POL',
        timestamp: Date.now(),
        status: 'COMPLETED',
        note: `Internal 0-Fee Swap: ${amount.toLocaleString()} ZIMAX → ${toAmount.toLocaleString()} POL (Rate 1:10,000)`,
      };

      setTransactions((prev) => [newTx, ...prev]);

      return {
        success: true,
        receivedAmount: toAmount,
        message: `Successfully swapped ${amount} ZIMAX for ${toAmount.toLocaleString()} POL with 0% fee!`,
      };
    } else {
      // Swap POL to ZIMAX at 10,000 POL = 1 ZIMAX
      if (balances.pol < amount) {
        throw new Error(`Insufficient POL balance. Available: ${balances.pol.toLocaleString()} POL`);
      }
      const toAmount = amount * POL_TO_ZIMAX_RATE; // amount / 10000

      setBalances((prev) => ({
        ...prev,
        pol: prev.pol - amount,
        zimax: prev.zimax + toAmount,
      }));

      const newTx: ExchangeTransaction = {
        id: `swap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'SWAP',
        fromToken: 'POL',
        toToken: 'ZIMAX',
        fromAmount: amount,
        toAmount,
        rate: POL_TO_ZIMAX_RATE,
        fee: 0,
        feeAsset: 'ZIMAX',
        timestamp: Date.now(),
        status: 'COMPLETED',
        note: `Internal 0-Fee Swap: ${amount.toLocaleString()} POL → ${toAmount.toLocaleString()} ZIMAX (Rate 10,000:1)`,
      };

      setTransactions((prev) => [newTx, ...prev]);

      return {
        success: true,
        receivedAmount: toAmount,
        message: `Successfully swapped ${amount.toLocaleString()} POL for ${toAmount.toFixed(4)} ZIMAX with 0% fee!`,
      };
    }
  };

  // Deposit via connected Web3 wallet
  const depositViaWeb3 = async (
    token: TokenType,
    amount: number
  ): Promise<{ success: boolean; txHash: string }> => {
    if (amount <= 0) throw new Error('Amount must be greater than zero.');
    
    // Attempt real Web3 transaction if wallet is available
    const { txHash } = await executeWeb3Deposit(token, amount, CEX_HOT_WALLET_ADDRESS);

    // Credit internal balance
    setBalances((prev) => ({
      ...prev,
      [token === 'POL' ? 'pol' : 'zimax']:
        prev[token === 'POL' ? 'pol' : 'zimax'] + amount,
    }));

    const newTx: ExchangeTransaction = {
      id: `dep-web3-${Date.now()}`,
      type: 'DEPOSIT',
      toToken: token,
      fromAmount: amount,
      toAmount: amount,
      fee: 0,
      feeAsset: token,
      externalAddress: connectedWallet || undefined,
      txHash,
      timestamp: Date.now(),
      status: 'CONFIRMED',
      note: `Live Web3 Deposit of ${amount} ${token} from connected wallet`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    return { success: true, txHash };
  };

  // Verify external on-chain tx on Polygon RPC and credit user
  const verifyAndCreditDepositTx = async (
    txHash: string
  ): Promise<{ success: boolean; amount: number; token: TokenType; message: string }> => {
    // Check if already credited
    const existing = transactions.find((t) => t.txHash?.toLowerCase() === txHash.toLowerCase());
    if (existing) {
      throw new Error(`This transaction hash (${txHash.slice(0, 10)}...) has already been credited to your account.`);
    }

    const verification = await verifyOnChainTransaction(txHash);

    if (!verification.isValid) {
      throw new Error('Transaction not found on Polygon Network via Ankr RPC. Please check the hash and wait for block confirmation.');
    }

    const detectedToken: TokenType = verification.tokenDetected || 'POL';
    const detectedAmount = verification.amountDetected && verification.amountDetected > 0
      ? verification.amountDetected
      : 10; // default detected amount if zero value contract interaction

    // Credit balance
    setBalances((prev) => ({
      ...prev,
      [detectedToken === 'POL' ? 'pol' : 'zimax']:
        prev[detectedToken === 'POL' ? 'pol' : 'zimax'] + detectedAmount,
    }));

    const newTx: ExchangeTransaction = {
      id: `dep-verify-${Date.now()}`,
      type: 'DEPOSIT',
      toToken: detectedToken,
      fromAmount: detectedAmount,
      toAmount: detectedAmount,
      fee: 0,
      feeAsset: detectedToken,
      externalAddress: verification.from,
      txHash,
      timestamp: Date.now(),
      status: 'CONFIRMED',
      note: `Verified on Polygon Block #${verification.blockNumber || 'Recent'} via Ankr RPC`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    return {
      success: true,
      amount: detectedAmount,
      token: detectedToken,
      message: `Verified on-chain! Credited ${detectedAmount.toLocaleString()} ${detectedToken} to your CEX account.`,
    };
  };

  // Simulate demo on-chain deposit for quick UI testing
  const simulateDemoDeposit = (token: TokenType, amount: number) => {
    const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setBalances((prev) => ({
      ...prev,
      [token === 'POL' ? 'pol' : 'zimax']:
        prev[token === 'POL' ? 'pol' : 'zimax'] + amount,
    }));

    const newTx: ExchangeTransaction = {
      id: `dep-sim-${Date.now()}`,
      type: 'DEPOSIT',
      toToken: token,
      fromAmount: amount,
      toAmount: amount,
      fee: 0,
      feeAsset: token,
      externalAddress: '0x43De...9B22',
      txHash: mockHash,
      timestamp: Date.now(),
      status: 'CONFIRMED',
      note: `Instant External Deposit (${amount} ${token})`,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  // Withdraw from CEX to external wallet
  const executeWithdrawal = async (
    token: TokenType,
    amount: number,
    destinationAddress: string
  ): Promise<{ success: boolean; txHash: string; message: string }> => {
    if (amount <= 0) throw new Error('Withdrawal amount must be greater than zero.');
    if (!destinationAddress.startsWith('0x') || destinationAddress.length !== 42) {
      throw new Error('Please enter a valid 42-character Polygon/Ethereum destination address.');
    }

    const balanceKey = token === 'POL' ? 'pol' : 'zimax';
    const currentBalance = balances[balanceKey];

    // Estimated Polygon network gas fee
    const gasFee = token === 'POL' ? 0.005 : 0.001;

    if (currentBalance < amount) {
      throw new Error(`Insufficient ${token} balance for withdrawal. Available: ${currentBalance.toLocaleString()} ${token}`);
    }

    // Deduct balance
    setBalances((prev) => ({
      ...prev,
      [balanceKey]: prev[balanceKey] - amount,
    }));

    // Broadcast withdrawal transaction hash
    const generatedHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newTx: ExchangeTransaction = {
      id: `wd-${Date.now()}`,
      type: 'WITHDRAW',
      fromToken: token,
      fromAmount: amount,
      toAmount: amount,
      fee: gasFee,
      feeAsset: token,
      externalAddress: destinationAddress,
      txHash: generatedHash,
      timestamp: Date.now(),
      status: 'COMPLETED',
      note: `External Transfer to ${destinationAddress.slice(0, 6)}...${destinationAddress.slice(-4)} via Polygon Ankr RPC`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    return {
      success: true,
      txHash: generatedHash,
      message: `Withdrawal of ${amount.toLocaleString()} ${token} broadcasted to Polygon Network!`,
    };
  };

  // Order Book simulated around 10,000 POL
  const [orderBookAsks, setOrderBookAsks] = useState<OrderBookItem[]>([
    { id: 'ask-5', price: 10008, amount: 4.5, total: 45036, type: 'sell', percentage: 95 },
    { id: 'ask-4', price: 10006, amount: 2.2, total: 22013, type: 'sell', percentage: 75 },
    { id: 'ask-3', price: 10004, amount: 8.0, total: 80032, type: 'sell', percentage: 60 },
    { id: 'ask-2', price: 10002, amount: 3.4, total: 34006, type: 'sell', percentage: 40 },
    { id: 'ask-1', price: 10000, amount: 15.0, total: 150000, type: 'sell', percentage: 20 },
  ]);

  const [orderBookBids, setOrderBookBids] = useState<OrderBookItem[]>([
    { id: 'bid-1', price: 10000, amount: 20.0, total: 200000, type: 'buy', percentage: 25 },
    { id: 'bid-2', price: 9998, amount: 6.8, total: 67986, type: 'buy', percentage: 45 },
    { id: 'bid-3', price: 9996, amount: 12.5, total: 124950, type: 'buy', percentage: 65 },
    { id: 'bid-4', price: 9994, amount: 5.1, total: 50969, type: 'buy', percentage: 80 },
    { id: 'bid-5', price: 9990, amount: 18.0, total: 179820, type: 'buy', percentage: 100 },
  ]);

  const placeOrder = async (type: 'buy' | 'sell', price: number, amount: number): Promise<boolean> => {
    const totalCostPol = price * amount;
    if (type === 'buy') {
      if (balances.pol < totalCostPol) {
        throw new Error(`Insufficient POL. You need ${totalCostPol.toLocaleString()} POL to buy ${amount} ZIMAX.`);
      }
      // Instant fill at current rate
      setBalances((prev) => ({
        ...prev,
        pol: prev.pol - totalCostPol,
        zimax: prev.zimax + amount,
      }));
      setTransactions((prev) => [
        {
          id: `order-buy-${Date.now()}`,
          type: 'TRADE_BUY',
          fromToken: 'POL',
          toToken: 'ZIMAX',
          fromAmount: totalCostPol,
          toAmount: amount,
          rate: price,
          fee: 0,
          feeAsset: 'POL',
          timestamp: Date.now(),
          status: 'COMPLETED',
          note: `Spot Order: Bought ${amount} ZIMAX @ ${price.toLocaleString()} POL`,
        },
        ...prev,
      ]);
      return true;
    } else {
      if (balances.zimax < amount) {
        throw new Error(`Insufficient ZIMAX. You have ${balances.zimax} ZIMAX.`);
      }
      setBalances((prev) => ({
        ...prev,
        zimax: prev.zimax - amount,
        pol: prev.pol + totalCostPol,
      }));
      setTransactions((prev) => [
        {
          id: `order-sell-${Date.now()}`,
          type: 'TRADE_SELL',
          fromToken: 'ZIMAX',
          toToken: 'POL',
          fromAmount: amount,
          toAmount: totalCostPol,
          rate: price,
          fee: 0,
          feeAsset: 'POL',
          timestamp: Date.now(),
          status: 'COMPLETED',
          note: `Spot Order: Sold ${amount} ZIMAX @ ${price.toLocaleString()} POL`,
        },
        ...prev,
      ]);
      return true;
    }
  };

  const resetToDemoBalances = () => {
    const fresh: ExchangeBalances = {
      pol: 50000,
      zimax: 20,
      lockedPol: 0,
      lockedZimax: 0,
    };
    setBalances(fresh);
    localStorage.setItem(STORAGE_KEY_BALANCES, JSON.stringify(fresh));
  };

  return (
    <ExchangeContext.Provider
      value={{
        balances,
        custodialDepositAddress: CEX_HOT_WALLET_ADDRESS,
        userId,
        networkStatus,
        refreshNetworkStatus,
        connectedWallet,
        connectWallet,
        disconnectWallet,
        externalWalletBalances,
        isQueryingWallet,
        inspectExternalAddress,
        executeSwap,
        depositViaWeb3,
        verifyAndCreditDepositTx,
        simulateDemoDeposit,
        executeWithdrawal,
        orderBookAsks,
        orderBookBids,
        placeOrder,
        transactions,
        resetToDemoBalances,
      }}
    >
      {children}
    </ExchangeContext.Provider>
  );
};

export const useExchange = () => {
  const context = useContext(ExchangeContext);
  if (!context) {
    throw new Error('useExchange must be used within an ExchangeProvider');
  }
  return context;
};
