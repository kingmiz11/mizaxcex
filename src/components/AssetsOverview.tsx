import React, { useState } from 'react';
import { useExchange, TokenType, TransactionType } from '../context/ExchangeContext';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { ZIMAX_CONTRACT_ADDRESS, ZIMAX_TO_POL_RATE } from '../services/polygon';

interface AssetsOverviewProps {
  openDepositModal: (token?: TokenType) => void;
  openWithdrawModal: (token?: TokenType) => void;
  onNavigateSwap: () => void;
  onNavigateTrade: () => void;
}

export const AssetsOverview: React.FC<AssetsOverviewProps> = ({
  openDepositModal,
  openWithdrawModal,
  onNavigateSwap,
  onNavigateTrade,
}) => {
  const { balances, transactions, userId, resetToDemoBalances } = useExchange();
  const [filterType, setFilterType] = useState<string>('ALL');

  // Total valuation: POL balance + (ZIMAX balance * 10,000)
  const totalEquityInPol = balances.pol + balances.zimax * ZIMAX_TO_POL_RATE;
  // Estimated USD assuming 1 POL = ~$0.38
  const estimatedUsd = totalEquityInPol * 0.38;

  const filteredTxs = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'SWAP') return tx.type === 'SWAP';
    if (filterType === 'DEPOSIT') return tx.type === 'DEPOSIT';
    if (filterType === 'WITHDRAW') return tx.type === 'WITHDRAW';
    if (filterType === 'TRADE') return tx.type === 'TRADE_BUY' || tx.type === 'TRADE_SELL';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Portfolio Header Card */}
      <div className="bg-[#121721] rounded-2xl border border-[#1e2638] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Exchange Account ID:</span>
            <span className="font-mono text-purple-300 font-semibold">{userId}</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-medium">Standard Custodial Tier</span>
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Total Account Equity
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white">
              {totalEquityInPol.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-lg font-bold text-slate-400">POL</span>
            <span className="text-xs text-slate-500 font-mono">
              ≈ ${estimatedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>

        {/* Global CTA buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => openDepositModal('ZIMAX')}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-purple-950/40"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit Tokens</span>
          </button>

          <button
            onClick={() => openWithdrawModal('ZIMAX')}
            className="px-4 py-2.5 bg-[#172033] hover:bg-[#202c46] border border-[#263554] text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4 text-blue-400" />
            <span>Withdraw</span>
          </button>

          <button
            onClick={resetToDemoBalances}
            title="Reset to 50,000 POL and 20 ZIMAX test balance"
            className="px-3 py-2.5 bg-[#121824] hover:bg-[#1a2336] border border-[#1d273d] text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Balances</span>
          </button>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-[#121721] rounded-2xl border border-[#1e2638] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-[#1c2438] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Spot Custodial Holdings</h2>
            <p className="text-xs text-slate-400">Available and reserved tokens in your CEX wallet</p>
          </div>
          <span className="text-xs font-mono text-purple-400">1 ZIMAX = 10,000 POL Fixed Peg</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono tabular-nums">
            <thead>
              <tr className="text-slate-400 border-b border-[#1c2438] bg-[#0d121c] text-[11px] font-sans">
                <th className="py-3 px-6 text-left font-semibold">Asset</th>
                <th className="py-3 px-6 text-right font-semibold">Total Balance</th>
                <th className="py-3 px-6 text-right font-semibold">Available</th>
                <th className="py-3 px-6 text-right font-semibold">In Order</th>
                <th className="py-3 px-6 text-right font-semibold">Valuation (POL)</th>
                <th className="py-3 px-6 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171e2e]">
              {/* Row 1: ZIMAX */}
              <tr className="hover:bg-[#151c2b] transition-colors">
                <td className="py-4 px-6 text-left font-sans">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                      Z
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">ZIMAX</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Polygon ERC-20
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-right font-bold text-white text-sm">
                  {balances.zimax.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </td>
                <td className="py-4 px-6 text-right text-slate-300">
                  {balances.zimax.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </td>
                <td className="py-4 px-6 text-right text-slate-500">0.0000</td>
                <td className="py-4 px-6 text-right font-bold text-purple-400">
                  {(balances.zimax * ZIMAX_TO_POL_RATE).toLocaleString(undefined, { maximumFractionDigits: 2 })} POL
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => openDepositModal('ZIMAX')}
                      className="px-2.5 py-1 rounded bg-[#182133] hover:bg-purple-600 text-slate-300 hover:text-white font-medium transition-colors text-[11px]"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => openWithdrawModal('ZIMAX')}
                      className="px-2.5 py-1 rounded bg-[#182133] hover:bg-blue-600 text-slate-300 hover:text-white font-medium transition-colors text-[11px]"
                    >
                      Withdraw
                    </button>
                    <button
                      onClick={onNavigateSwap}
                      className="px-2.5 py-1 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-800/40 text-purple-300 hover:text-white font-medium transition-colors text-[11px]"
                    >
                      Swap Free
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 2: POL */}
              <tr className="hover:bg-[#151c2b] transition-colors">
                <td className="py-4 px-6 text-left font-sans">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      P
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Polygon (POL)</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Polygon PoS Native
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-right font-bold text-white text-sm">
                  {balances.pol.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </td>
                <td className="py-4 px-6 text-right text-slate-300">
                  {balances.pol.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </td>
                <td className="py-4 px-6 text-right text-slate-500">0.0000</td>
                <td className="py-4 px-6 text-right font-bold text-white">
                  {balances.pol.toLocaleString(undefined, { maximumFractionDigits: 2 })} POL
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => openDepositModal('POL')}
                      className="px-2.5 py-1 rounded bg-[#182133] hover:bg-purple-600 text-slate-300 hover:text-white font-medium transition-colors text-[11px]"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => openWithdrawModal('POL')}
                      className="px-2.5 py-1 rounded bg-[#182133] hover:bg-blue-600 text-slate-300 hover:text-white font-medium transition-colors text-[11px]"
                    >
                      Withdraw
                    </button>
                    <button
                      onClick={onNavigateSwap}
                      className="px-2.5 py-1 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-800/40 text-purple-300 hover:text-white font-medium transition-colors text-[11px]"
                    >
                      Swap Free
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction & Activity Ledger */}
      <div className="bg-[#121721] rounded-2xl border border-[#1e2638] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-[#1c2438] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Activity Ledger</h2>
            <p className="text-xs text-slate-400">Complete record of swaps, deposits, withdrawals and trades</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-xl border border-[#1a2233] text-xs font-medium">
            {['ALL', 'SWAP', 'DEPOSIT', 'WITHDRAW', 'TRADE'].map((ft) => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === ft
                    ? 'bg-[#1b2438] text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ft === 'ALL'
                  ? 'All History'
                  : ft === 'SWAP'
                  ? 'Swaps'
                  : ft === 'DEPOSIT'
                  ? 'Deposits'
                  : ft === 'WITHDRAW'
                  ? 'Withdrawals'
                  : 'Spot Orders'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredTxs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-sans">
              No transactions found for the selected filter.
            </div>
          ) : (
            <table className="w-full text-xs font-mono tabular-nums">
              <thead>
                <tr className="text-slate-400 border-b border-[#1c2438] bg-[#0d121c] text-[11px] font-sans">
                  <th className="py-3 px-6 text-left font-semibold">Type</th>
                  <th className="py-3 px-6 text-left font-semibold">Details</th>
                  <th className="py-3 px-6 text-right font-semibold">Amount</th>
                  <th className="py-3 px-6 text-right font-semibold">Fee</th>
                  <th className="py-3 px-6 text-center font-semibold">Status</th>
                  <th className="py-3 px-6 text-right font-semibold">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171e2e]">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#151c2b] transition-colors">
                    <td className="py-3.5 px-6 text-left font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'SWAP'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                            : tx.type === 'DEPOSIT'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                            : tx.type === 'WITHDRAW'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800/40'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-left font-sans">
                      <div className="text-slate-200 font-medium">{tx.note || 'Internal execution'}</div>
                      {tx.txHash && (
                        <a
                          href={`https://polygonscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-mono inline-flex items-center gap-1 mt-0.5"
                        >
                          <span>Hash: {tx.txHash.slice(0, 16)}...</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-white">
                      {tx.toAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                      <span className="text-slate-400 font-normal">{tx.toToken || tx.fromToken}</span>
                    </td>
                    <td className="py-3.5 px-6 text-right text-emerald-400 font-medium">
                      {tx.fee === 0 ? '0.00 (Free)' : `${tx.fee} ${tx.feeAsset}`}
                    </td>
                    <td className="py-3.5 px-6 text-center font-sans">
                      <span className="text-emerald-400 font-semibold text-[11px]">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-500 text-[11px]">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
