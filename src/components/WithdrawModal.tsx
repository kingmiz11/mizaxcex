import React, { useState } from 'react';
import { useExchange, TokenType } from '../context/ExchangeContext';
import {
  X,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultToken?: TokenType;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  defaultToken = 'ZIMAX',
}) => {
  const {
    balances,
    connectedWallet,
    executeWithdrawal,
    networkStatus,
  } = useExchange();

  const [selectedToken, setSelectedToken] = useState<TokenType>(defaultToken);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
    txHash?: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentAvailable = selectedToken === 'POL' ? balances.pol : balances.zimax;
  const numAmount = parseFloat(amount) || 0;

  // Gas fee from live Polygon Ankr RPC
  const estimatedGasPol = 0.005;

  const handleSetMax = () => {
    if (selectedToken === 'POL') {
      const maxPol = Math.max(0, balances.pol - estimatedGasPol);
      setAmount(maxPol.toFixed(4).replace(/\.?0+$/, ''));
    } else {
      setAmount(balances.zimax.toString());
    }
  };

  const handlePasteConnectedWallet = () => {
    if (connectedWallet) {
      setRecipientAddress(connectedWallet);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientAddress.trim().startsWith('0x') || recipientAddress.trim().length !== 42) {
      setStatusMsg({
        type: 'error',
        text: 'Please enter a valid 42-character Polygon/Ethereum recipient address.',
      });
      return;
    }

    if (numAmount <= 0) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid amount greater than zero.' });
      return;
    }

    if (numAmount > currentAvailable) {
      setStatusMsg({
        type: 'error',
        text: `Insufficient ${selectedToken} balance. You have ${currentAvailable.toLocaleString()} ${selectedToken}.`,
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await executeWithdrawal(selectedToken, numAmount, recipientAddress.trim());
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#a855f7'],
      });
      setStatusMsg({
        type: 'success',
        text: `Withdrawal broadcasted successfully! ${numAmount.toLocaleString()} ${selectedToken} sent to external wallet.`,
        txHash: res.txHash,
      });
      setAmount('');
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to broadcast withdrawal to Polygon network.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#121721] border border-[#1e2638] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c2438]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
              ↑
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Send / Withdraw Tokens</h2>
              <p className="text-xs text-slate-400">Transfer from CEX to external Polygon wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a2233] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
          {/* Select Asset */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Asset to Send
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
                  <div className="text-[10px] text-slate-500 font-mono">
                    Avail: {balances.zimax.toLocaleString()}
                  </div>
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
                  <div className="text-[10px] text-slate-500 font-mono">
                    Avail: {balances.pol.toLocaleString()}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Destination Address */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <label className="font-semibold">Recipient Polygon Address</label>
              {connectedWallet && (
                <button
                  type="button"
                  onClick={handlePasteConnectedWallet}
                  className="text-purple-400 hover:text-purple-300 text-[11px] font-medium flex items-center gap-1"
                >
                  <Wallet className="w-3 h-3" />
                  <span>Use Connected Wallet</span>
                </button>
              )}
            </div>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => {
                setRecipientAddress(e.target.value);
                setStatusMsg(null);
              }}
              placeholder="0x..."
              className="w-full bg-[#0b0e14] border border-[#1a2233] focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Withdrawal Amount</span>
              <div className="flex items-center gap-1.5">
                <span>Available:</span>
                <span className="font-mono tabular-nums text-slate-200 font-semibold">
                  {currentAvailable.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedToken}
                </span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-blue-400 hover:text-blue-300 font-semibold uppercase text-[11px] ml-1 px-1.5 py-0.5 rounded bg-blue-950/50 hover:bg-blue-900/50 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex items-center bg-[#0b0e14] border border-[#1a2233] focus-within:border-blue-500/60 rounded-xl px-3.5 py-2">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setStatusMsg(null);
                }}
                placeholder="0.00"
                className="w-full bg-transparent font-mono text-lg font-bold text-white placeholder-slate-600 focus:outline-none"
              />
              <span className="text-xs font-mono text-slate-400 shrink-0 font-semibold">
                {selectedToken}
              </span>
            </div>
          </div>

          {/* Fee & Network Breakdown */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#1a2233] space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Network</span>
              <span className="text-white font-medium">Polygon PoS (Chain ID 137)</span>
            </div>
            <div className="flex justify-between">
              <span>RPC Broadcast Endpoint</span>
              <span className="text-slate-300 font-mono text-[11px] truncate max-w-[200px]">
                rpc.ankr.com/polygon/...
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Network Gas</span>
              <span className="text-slate-200 font-mono">~0.005 POL</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#161d2b]">
              <span className="text-white font-semibold">You Will Receive:</span>
              <span className="text-blue-400 font-mono font-bold">
                {numAmount > 0 ? numAmount.toLocaleString() : '0.00'} {selectedToken}
              </span>
            </div>
          </div>

          {/* Status feedback */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
              {statusMsg.txHash && (
                <div className="pt-1">
                  <a
                    href={`https://polygonscan.com/tx/${statusMsg.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-300 underline font-mono"
                  >
                    <span>View Transaction on PolygonScan: {statusMsg.txHash.slice(0, 16)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={isSubmitting || numAmount <= 0}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Broadcasting to Polygon Network...</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>Confirm & Send {selectedToken} to External Wallet</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
