import { ethers } from 'ethers';

// User-specified Ankr RPC URL for Polygon Network
export const POLYGON_RPC_URL =
  'https://rpc.ankr.com/polygon/14b282c877fc1d6e8020397b44259c00f6b3261504530e433701e69f4a99df49';

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_CHAIN_ID_HEX = '0x89';

// ZIMAX Token contract address on Polygon
export const ZIMAX_CONTRACT_ADDRESS = '0x6e99a2db2046e1C2197782f704Df48b7Ab1F68D5';

// Internal fixed swap rate: 1 ZIMAX = 10,000 POL
export const ZIMAX_TO_POL_RATE = 10000;
export const POL_TO_ZIMAX_RATE = 0.0001;

// Minimal ERC20 ABI for querying metadata, balance, and initiating transfers
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// Custodial CEX Deposit Address for this exchange instance (deterministic safe vault address)
export const CEX_HOT_WALLET_ADDRESS = '0x892B19F4Df28B47833e9d8F5C93d84Ec02564019';

// Cached provider instance
let cachedProvider: ethers.JsonRpcProvider | null = null;

export function getPolygonProvider(): ethers.JsonRpcProvider {
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(POLYGON_RPC_URL, {
      chainId: POLYGON_CHAIN_ID,
      name: 'polygon',
    });
  }
  return cachedProvider;
}

export interface NetworkStatus {
  blockNumber: number;
  gasPriceGwei: string;
  latencyMs: number;
  isOnline: boolean;
  rpcUrl: string;
}

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
}

export interface LiveWalletBalances {
  address: string;
  polBalance: string;
  zimaxBalance: string;
  formattedPol: number;
  formattedZimax: number;
  lastUpdated: number;
}

/**
 * Fetch live network status, block number, and gas price via Ankr Polygon RPC
 */
export async function fetchPolygonNetworkStatus(): Promise<NetworkStatus> {
  const provider = getPolygonProvider();
  const startTime = performance.now();
  try {
    const [blockNumber, feeData] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData(),
    ]);
    const latencyMs = Math.round(performance.now() - startTime);
    const gasPriceGwei = feeData.gasPrice
      ? Number(ethers.formatUnits(feeData.gasPrice, 'gwei')).toFixed(1)
      : '35.0';

    return {
      blockNumber,
      gasPriceGwei,
      latencyMs,
      isOnline: true,
      rpcUrl: POLYGON_RPC_URL,
    };
  } catch (error) {
    console.error('Failed to fetch Polygon network status:', error);
    return {
      blockNumber: 62450890,
      gasPriceGwei: '32.5',
      latencyMs: 120,
      isOnline: false,
      rpcUrl: POLYGON_RPC_URL,
    };
  }
}

/**
 * Fetch live on-chain balances for POL and ZIMAX from any external address
 */
export async function fetchLiveWalletBalances(address: string): Promise<LiveWalletBalances> {
  const provider = getPolygonProvider();

  if (!ethers.isAddress(address)) {
    throw new Error('Invalid Polygon wallet address');
  }

  try {
    // 1. Fetch native POL balance
    const polBigInt = await provider.getBalance(address);
    const formattedPol = Number(ethers.formatEther(polBigInt));

    // 2. Fetch ZIMAX ERC20 balance
    let formattedZimax = 0;
    try {
      const contract = new ethers.Contract(ZIMAX_CONTRACT_ADDRESS, ERC20_ABI, provider);
      const zimaxBigInt = await contract.balanceOf(address);
      formattedZimax = Number(ethers.formatUnits(zimaxBigInt, 18));
    } catch (tokenErr) {
      console.warn('Could not read ZIMAX balance for address, returning 0', tokenErr);
      formattedZimax = 0;
    }

    return {
      address,
      polBalance: formattedPol.toLocaleString('en-US', { maximumFractionDigits: 4 }),
      zimaxBalance: formattedZimax.toLocaleString('en-US', { maximumFractionDigits: 4 }),
      formattedPol,
      formattedZimax,
      lastUpdated: Date.now(),
    };
  } catch (err: any) {
    console.error('Error querying on-chain wallet balance:', err);
    throw new Error(err?.message || 'Failed to query live balances via Polygon RPC');
  }
}

/**
 * Verify on-chain transaction receipt using the Ankr Polygon RPC
 */
export async function verifyOnChainTransaction(txHash: string): Promise<{
  isValid: boolean;
  blockNumber?: number;
  from?: string;
  to?: string;
  tokenDetected?: 'POL' | 'ZIMAX';
  amountDetected?: number;
  status?: 'confirmed' | 'failed' | 'pending';
  rawReceipt?: any;
}> {
  const provider = getPolygonProvider();
  const cleanHash = txHash.trim();

  if (!/^0x([A-Fa-f0-9]{64})$/.test(cleanHash)) {
    throw new Error('Transaction hash must be a 66-character hex string starting with 0x');
  }

  try {
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(cleanHash),
      provider.getTransactionReceipt(cleanHash),
    ]);

    if (!tx && !receipt) {
      return {
        isValid: false,
        status: 'pending',
      };
    }

    const isConfirmed = receipt ? receipt.status === 1 : false;

    // Check if it's native POL transfer
    if (tx && tx.value > 0n) {
      const amount = Number(ethers.formatEther(tx.value));
      return {
        isValid: true,
        blockNumber: receipt?.blockNumber ?? tx.blockNumber ?? undefined,
        from: tx.from,
        to: tx.to ?? undefined,
        tokenDetected: 'POL',
        amountDetected: amount,
        status: isConfirmed ? 'confirmed' : 'pending',
        rawReceipt: receipt,
      };
    }

    // Check if it's ERC20 transfer of ZIMAX
    if (receipt && receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === ZIMAX_CONTRACT_ADDRESS.toLowerCase()) {
          try {
            const iface = new ethers.Interface(ERC20_ABI);
            const parsed = iface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });
            if (parsed && parsed.name === 'Transfer') {
              const amount = Number(ethers.formatUnits(parsed.args[2], 18));
              return {
                isValid: true,
                blockNumber: receipt.blockNumber,
                from: parsed.args[0],
                to: parsed.args[1],
                tokenDetected: 'ZIMAX',
                amountDetected: amount,
                status: isConfirmed ? 'confirmed' : 'pending',
                rawReceipt: receipt,
              };
            }
          } catch {
            // Ignore non-transfer logs
          }
        }
      }
    }

    return {
      isValid: true,
      blockNumber: receipt?.blockNumber ?? tx?.blockNumber ?? undefined,
      from: tx?.from,
      to: tx?.to ?? undefined,
      status: isConfirmed ? 'confirmed' : 'pending',
      rawReceipt: receipt,
    };
  } catch (error: any) {
    console.error('Error verifying tx on Polygon RPC:', error);
    throw new Error(error?.message || 'Failed to inspect transaction on Polygon RPC');
  }
}

/**
 * Trigger external wallet transfer via window.ethereum (MetaMask, OKX, Rabby)
 */
export async function executeWeb3Deposit(
  token: 'POL' | 'ZIMAX',
  amount: number,
  depositTarget: string
): Promise<{ txHash: string }> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No Web3 browser wallet detected (e.g. MetaMask). Please install an extension or enter tx hash manually.');
  }

  const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await browserProvider.getSigner();

  // Ensure network is Polygon
  const network = await browserProvider.getNetwork();
  if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: POLYGON_CHAIN_ID_HEX,
              chainName: 'Polygon Mainnet',
              nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
              rpcUrls: [POLYGON_RPC_URL],
              blockExplorerUrls: ['https://polygonscan.com'],
            },
          ],
        });
      } else {
        throw new Error('Please switch your wallet network to Polygon Mainnet (Chain ID 137).');
      }
    }
  }

  if (token === 'POL') {
    const tx = await signer.sendTransaction({
      to: depositTarget,
      value: ethers.parseEther(amount.toString()),
    });
    return { txHash: tx.hash };
  } else {
    // ERC-20 ZIMAX Transfer
    const contract = new ethers.Contract(ZIMAX_CONTRACT_ADDRESS, ERC20_ABI, signer);
    const parsedAmount = ethers.parseUnits(amount.toString(), 18);
    const tx = await contract.transfer(depositTarget, parsedAmount);
    return { txHash: tx.hash };
  }
}
