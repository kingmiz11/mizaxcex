import React, { useState } from 'react';
import { useExchange, TokenType } from '../context/ExchangeContext';
import {
  X,
  Copy,
  Check,
  QrCode,
  Wallet,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Search,
  RefreshCw,
  Info,
} from 'lucide-react';
import { QrCodeSvg } from './QrCodeSvg';
import {
  CEX_HOT_WALLET_ADDRESS,
  ZIMAX_CONTRACT_ADDRESS,
  POLYGON_RPC_URL,
} from '../services/polygon';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultToken?: TokenType;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  defaultToken = 'ZIMAX',
}) => {
  const {
    balances,
    custodialDepositAddress,
    connectedWallet,
    connectWallet,
    depositViaWeb3,
    verifyAndCreditDepositTx,
    simulateDemoDeposit,
  } = useExchange();

  const [selectedToken, setSelectedToken] = useState<TokenType>(defaultToken);
  const [activeMethod, setActiveMethod] = useState<'address' | 'web3' | 'tx_verify'>('address');
  const [copied, setCopied] = useState(false);

  // Web3 direct deposit state
  const [web3Amount, setWeb3Amount] = useState<string>('5');
  const [isWeb3Submitting, setIsWeb3Submitting] = useState(false);

  // Tx verification state
  const [verifyTxHash, setVerifyTxHash] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Feedback notifications
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(custodialDepositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectWeb3Deposit = async () => {
    const num = parseFloat(web3Amount);
    if (!num || num <= 0) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid deposit amount.' });
      return;
    }

    setIsWeb3Submitting(true);
    setStatusMsg(null);

    try {
      if (!connectedWallet) {
        await connectWallet();
      }
      const res = await depositViaWeb3(selectedToken, num);
      setStatusMsg({
        type: 'success',
        text: `Deposit confirmed on Polygon! Tx Hash: ${res.txHash.slice(0, 14)}...`,
      });
      setWeb3Amount('5');
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'External Web3 deposit failed or was rejected.',
      });
    } finally {
      setIsWeb3Submitting(false);
    }
  };

  const handleVerifyOnChainHash = async () => {
    if (!verifyTxHash.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a transaction hash.' });
      return;
    }

    setIsVerifying(true);
    setStatusMsg(null);

    try {
      const res = await verifyAndCreditDepositTx(verifyTxHash.trim());
      setStatusMsg({
        type: 'success',
        text: res.message,
      });
      setVerifyTxHash('');
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Could not verify transaction on Polygon RPC.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateFaucet = (amount: number) => {
    simulateDemoDeposit(selectedToken, amount);
    setStatusMsg({
      type: 'success',
      text: `Successfully received on-chain deposit simulation: +${amount} ${selectedToken} added to your CEX account!`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#121721] border border-[#1e2638] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c2438]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
              ↓
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Receive / Deposit Tokens</h2>
              <p className="text-xs text-slate-400">Transfer from external Polygon wallet to CEX</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a2233] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 1. Select Asset */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Deposit Asset
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedToken('ZIMAX');
                  setStatusMsg(null);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                  selectedToken === 'ZIMAX'
                    ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm'
                    : 'bg-[#0b0e14] border-[#1c2438] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  Z
                </div>
                <div>
                  <div className="font-bold text-xs text-white">ZIMAX Token</div>
                  <div className="text-[10px] text-slate-500 font-mono">ERC-20 (Polygon)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedToken('POL');
                  setStatusMsg(null);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                  selectedToken === 'POL'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#0b0e14] border-[#1c2438] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  P
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Polygon (POL)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Polygon Native Token</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Choose Method: Dedicated Address, Web3 Direct, or Tx Verification */}
          <div className="flex items-center gap-1 p-1 bg-[#0b0e14] rounded-xl border border-[#1a2233] text-xs">
            <button
              onClick={() => setActiveMethod('address')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                activeMethod === 'address'
                  ? 'bg-[#1b2438] text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deposit Address & QR
            </button>
            <button
              onClick={() => setActiveMethod('web3')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                activeMethod === 'web3'
                  ? 'bg-[#1b2438] text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Web3 1-Click Send
            </button>
            <button
              onClick={() => setActiveMethod('tx_verify')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                activeMethod === 'tx_verify'
                  ? 'bg-[#1b2438] text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Verify Tx Hash
            </button>
          </div>

          {/* Method A: QR & Custodial Polygon Address */}
          {activeMethod === 'address' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0b0e14] p-4 rounded-xl border border-[#1a2233]">
                <QrCodeSvg value={custodialDepositAddress} size={130} />
                <div className="space-y-2 flex-1 w-full text-left">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Your Dedicated Polygon Deposit Address
                  </div>
                  <div className="font-mono text-xs text-slate-200 bg-[#121721] p-2.5 rounded-lg border border-[#1e273a] break-all select-all">
                    {custodialDepositAddress}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182133] hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-medium transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-purple-400" />
                          <span>Copy Address</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`https://polygonscan.com/address/${custodialDepositAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-[#1a2336] text-slate-400 hover:text-slate-200 text-xs transition-colors"
                    >
                      <span>PolygonScan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Simulator Buttons for immediate test drive */}
              <div className="p-3 bg-[#0d121c] rounded-xl border border-[#1a2336] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">Testing without Polygon Mainnet gas?</div>
                  <div className="text-[11px] text-slate-400">Simulate on-chain deposit instant top-up:</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulateFaucet(selectedToken === 'ZIMAX' ? 10 : 5000)}
                    className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg font-mono font-semibold transition-colors text-xs"
                  >
                    +{selectedToken === 'ZIMAX' ? '10 ZIMAX' : '5,000 POL'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Method B: Direct Web3 Send */}
          {activeMethod === 'web3' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0b0e14] rounded-xl border border-[#1a2233] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Connected External Wallet:</span>
                  <span className="font-mono text-purple-400 font-semibold">
                    {connectedWallet
                      ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}`
                      : 'Not connected'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Amount to Deposit from External Wallet
                  </label>
                  <div className="flex items-center bg-[#121721] rounded-lg border border-[#1e273a] px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      value={web3Amount}
                      onChange={(e) => setWeb3Amount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent font-mono text-sm font-semibold text-white focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-mono shrink-0">
                      {selectedToken}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Sends directly through your browser wallet (MetaMask/Rabby) on Polygon Network
                  (Chain ID 137). Verified via Ankr RPC:{' '}
                  <span className="font-mono text-slate-300">rpc.ankr.com/polygon/...</span>
                </div>

                <button
                  onClick={handleDirectWeb3Deposit}
                  disabled={isWeb3Submitting}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isWeb3Submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Broadcasting to Polygon...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      <span>Deposit {selectedToken} via Web3 Wallet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Method C: Verify On-Chain Transaction Hash */}
          {activeMethod === 'tx_verify' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0b0e14] rounded-xl border border-[#1a2233] space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Enter Polygon Transaction Hash (0x...)
                  </label>
                  <input
                    type="text"
                    value={verifyTxHash}
                    onChange={(e) => setVerifyTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-[#121721] border border-[#1e273a] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500/60"
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The CEX engine will query the Ankr Polygon RPC node to verify the transaction
                  receipt, parse transfer logs, and instantly credit your exchange account!
                </p>

                <button
                  onClick={handleVerifyOnChainHash}
                  disabled={isVerifying || !verifyTxHash.trim()}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Querying Polygon RPC...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Verify Transaction on Polygon</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
                  : 'bg-blue-950/40 text-blue-300 border border-blue-800/50'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium break-all">{statusMsg.text}</div>
            </div>
          )}

          {/* Network details footer */}
          <div className="pt-2 border-t border-[#1c2438] text-[11px] text-slate-500 flex items-center justify-between">
            <span>Network: Polygon PoS (Chain ID 137)</span>
            <span className="font-mono">1 Confirm Required</span>
          </div>
        </div>
      </div>
    </div>
  );
};
