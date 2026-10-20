import React, { useState } from 'react';
import { useExchange, TokenType } from '../context/ExchangeContext';
import {
  ArrowDownUp,
  Zap,
  ShieldCheck,
  Info,
  ArrowRight,
  Sparkles,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ZIMAX_CONTRACT_ADDRESS, ZIMAX_TO_POL_RATE, POL_TO_ZIMAX_RATE } from '../services/polygon';

interface SwapModuleProps {
  openDepositModal: () => void;
  openWithdrawModal: () => void;
}

export const SwapModule: React.FC<SwapModuleProps> = ({
  openDepositModal,
  openWithdrawModal,
}) => {
  const { balances, executeSwap } = useExchange();

  const [fromToken, setFromToken] = useState<TokenType>('ZIMAX');
  const [fromAmount, setFromAmount] = useState<string>('1');
  const [isSwapping, setIsSwapping] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const toToken: TokenType = fromToken === 'ZIMAX' ? 'POL' : 'ZIMAX';
  const numericAmount = parseFloat(fromAmount) || 0;

  // Calculated To Amount based on the 1 ZIMAX : 10,000 POL rule
  const calculatedToAmount =
    fromToken === 'ZIMAX'
      ? numericAmount * ZIMAX_TO_POL_RATE
      : numericAmount * POL_TO_ZIMAX_RATE;

  const currentAvailableBalance =
    fromToken === 'ZIMAX' ? balances.zimax : balances.pol;

  const handleFlipTokens = () => {
    setFromToken((prev) => (prev === 'ZIMAX' ? 'POL' : 'ZIMAX'));
    // Recalculate equivalent amount for intuitive UX
    if (fromToken === 'ZIMAX') {
      setFromAmount((numericAmount * ZIMAX_TO_POL_RATE).toString());
    } else {
      setFromAmount((numericAmount * POL_TO_ZIMAX_RATE).toString());
    }
    setFeedback(null);
  };

  const setPercentage = (pct: number) => {
    const calculated = (currentAvailableBalance * pct) / 100;
    if (fromToken === 'ZIMAX') {
      setFromAmount(calculated.toFixed(4).replace(/\.?0+$/, ''));
    } else {
      setFromAmount(Math.floor(calculated).toString());
    }
  };

  const handleExecuteSwap = async () => {
    if (numericAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid amount to swap.' });
      return;
    }
    if (numericAmount > currentAvailableBalance) {
      setFeedback({
        type: 'error',
        message: `Insufficient ${fromToken} balance. You have ${currentAvailableBalance.toLocaleString()} ${fromToken}.`,
      });
      return;
    }

    setIsSwapping(true);
    setFeedback(null);

    try {
      const result = await executeSwap(fromToken, numericAmount);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#8b5cf6', '#10b981', '#3b82f6'],
      });
      setFeedback({
        type: 'success',
        message: result.message,
      });
      // Reset input to reasonable default
      setFromAmount('1');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to execute internal swap.',
      });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Editorial Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/40 border border-purple-800/50 rounded-full text-xs text-purple-300 font-medium mb-3">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>Zero-Fee Internal Swap · 1 ZIMAX = 10,000 POL</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Instant Internal Token Swap
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
          Exchange ZIMAX and Polygon (POL) with zero gas fees and zero slippage at
          the guaranteed 1 : 10,000 ratio directly inside your CEX custodial wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Swap Card */}
        <div className="lg:col-span-7 bg-[#121721] rounded-2xl border border-[#1e2638] p-5 sm:p-7 shadow-xl">
          {/* Header Strip */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1c2438] mb-5">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Market Swap
              </span>
              <p className="text-sm font-medium text-slate-200">
                {fromToken} → {toToken}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Fixed Exchange Rate</span>
              <p className="text-xs font-mono tabular-nums text-purple-400 font-semibold">
                1 ZIMAX = 10,000 POL
              </p>
            </div>
          </div>

          {/* From Input Section */}
          <div className="bg-[#0b0e14] rounded-xl p-4 border border-[#1a2233] mb-2 focus-within:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>You Pay</span>
              <div className="flex items-center gap-1.5">
                <span>Available:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-200">
                  {currentAvailableBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {fromToken}
                </span>
                <button
                  type="button"
                  onClick={() => setPercentage(100)}
                  className="text-purple-400 hover:text-purple-300 font-semibold uppercase text-[11px] ml-1 px-1.5 py-0.5 rounded bg-purple-950/50 hover:bg-purple-900/50 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <input
                type="number"
                min="0"
                step="any"
                value={fromAmount}
                onChange={(e) => {
                  setFromAmount(e.target.value);
                  setFeedback(null);
                }}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl sm:text-3xl font-mono tabular-nums font-bold text-white placeholder-slate-600 focus:outline-none"
              />
              <div className="flex items-center gap-2 bg-[#171f30] px-3.5 py-2 rounded-xl border border-[#232f48] shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    fromToken === 'ZIMAX'
                      ? 'bg-purple-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {fromToken === 'ZIMAX' ? 'Z' : 'P'}
                </div>
                <span className="font-bold text-white text-sm">{fromToken}</span>
              </div>
            </div>

            {/* Quick Percentages */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#161c2a]">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setPercentage(pct)}
                  className="flex-1 py-1 text-xs font-mono text-slate-400 hover:text-white bg-[#131926] hover:bg-[#1c2438] rounded-md transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Switch Direction Button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              type="button"
              onClick={handleFlipTokens}
              title="Reverse swap direction"
              className="p-2.5 rounded-full bg-[#182133] hover:bg-purple-600 text-purple-400 hover:text-white border border-[#263552] shadow-lg transition-all duration-200 transform hover:rotate-180"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* To Input Section */}
          <div className="bg-[#0b0e14] rounded-xl p-4 border border-[#1a2233] mt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>You Receive (Estimated)</span>
              <div className="flex items-center gap-1.5">
                <span>CEX Balance:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-200">
                  {(toToken === 'POL' ? balances.pol : balances.zimax).toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{' '}
                  {toToken}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-emerald-400 overflow-hidden text-ellipsis">
                {calculatedToAmount > 0
                  ? calculatedToAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })
                  : '0.00'}
              </div>
              <div className="flex items-center gap-2 bg-[#171f30] px-3.5 py-2 rounded-xl border border-[#232f48] shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    toToken === 'ZIMAX'
                      ? 'bg-purple-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {toToken === 'ZIMAX' ? 'Z' : 'P'}
                </div>
                <span className="font-bold text-white text-sm">{toToken}</span>
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{feedback.message}</div>
            </div>
          )}

          {/* Order Details / Transparency Box */}
          <div className="mt-5 space-y-2.5 text-xs text-slate-400 bg-[#0d121c] p-3.5 rounded-xl border border-[#1b2336]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>Swap Exchange Ratio</span>
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                1 ZIMAX = 10,000.00 POL
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Internal Swap Fee</span>
              <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                0.00 POL (100% Free)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Execution Slippage</span>
              <span className="font-mono tabular-nums text-slate-200">
                0.00% (Guaranteed Internal Peg)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Network Gas</span>
              <span className="font-mono tabular-nums text-slate-200">
                0.00 POL (Off-Chain Internal Ledger)
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="button"
            disabled={isSwapping || numericAmount <= 0}
            onClick={handleExecuteSwap}
            className={`w-full mt-5 py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all duration-150 flex items-center justify-center gap-2 ${
              isSwapping || numericAmount <= 0
                ? 'bg-[#1b2438] text-slate-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30 active:scale-[0.99]'
            }`}
          >
            {isSwapping ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Internal Clearing...</span>
              </>
            ) : numericAmount > currentAvailableBalance ? (
              <span>Insufficient {fromToken} Balance</span>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>
                  Swap {fromToken} to {toToken} for Free
                </span>
              </>
            )}
          </button>
        </div>

        {/* Informational & External Integration Sidebar */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Actions Card */}
          <div className="bg-[#121721] rounded-2xl border border-[#1e2638] p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-3">External Wallet Actions</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Seamlessly deposit funds from your external Polygon Web3 wallet or withdraw
              your tokens back to self-custody anytime.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={openDepositModal}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0b0e14] hover:bg-[#161e2e] border border-[#1e273a] text-xs font-medium text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800/50 flex items-center justify-center text-purple-400">
                    ↓
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold">Deposit from External Wallet</div>
                    <div className="text-[11px] text-slate-400">Receive POL or ZIMAX</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={openWithdrawModal}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0b0e14] hover:bg-[#161e2e] border border-[#1e273a] text-xs font-medium text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-800/50 flex items-center justify-center text-blue-400">
                    ↑
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold">Withdraw to External Wallet</div>
                    <div className="text-[11px] text-slate-400">Send tokens to any 0x address</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Token Contract Spotlight */}
          <div className="bg-[#121721] rounded-2xl border border-[#1e2638] p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-3">ZIMAX Contract Details</h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#1a2233]">
                <div className="text-slate-400 text-[11px] mb-1">Contract Address (Polygon PoS)</div>
                <div className="font-mono text-purple-300 text-xs break-all select-all">
                  {ZIMAX_CONTRACT_ADDRESS}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#1a2233]">
                  <span className="text-slate-500 block text-[11px]">Symbol</span>
                  <span className="font-semibold text-white">ZIMAX</span>
                </div>
                <div className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#1a2233]">
                  <span className="text-slate-500 block text-[11px]">Decimals</span>
                  <span className="font-semibold text-white font-mono">18</span>
                </div>
                <div className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#1a2233]">
                  <span className="text-slate-500 block text-[11px]">Chain</span>
                  <span className="font-semibold text-white">Polygon (137)</span>
                </div>
                <div className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#1a2233]">
                  <span className="text-slate-500 block text-[11px]">Internal Fee</span>
                  <span className="font-semibold text-emerald-400">0% (Free)</span>
                </div>
              </div>

              <a
                href={`https://polygonscan.com/token/${ZIMAX_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 pt-1 font-medium"
              >
                <span>View ZIMAX on PolygonScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
