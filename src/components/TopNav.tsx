import React from 'react';
import { useExchange } from '../context/ExchangeContext';
import { ArrowLeftRight, Wallet, Activity, Database, CheckCircle2, ShieldCheck } from 'lucide-react';

interface TopNavProps {
  currentTab: 'swap' | 'trade' | 'assets' | 'explorer';
  setCurrentTab: (tab: 'swap' | 'trade' | 'assets' | 'explorer') => void;
  openDepositModal: () => void;
  openWithdrawModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  setCurrentTab,
  openDepositModal,
  openWithdrawModal,
}) => {
  const {
    balances,
    userId,
    connectedWallet,
    connectWallet,
    disconnectWallet,
    networkStatus,
  } = useExchange();

  return (
    <header className="sticky top-0 z-40 bg-[#0b0e14]/95 backdrop-blur border-b border-[#1e2638] px-4 lg:px-8 py-3.5 flex items-center justify-between gap-8">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#swap"
          onClick={(e) => {
            e.preventDefault();
            setCurrentTab('swap');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
            Z
          </div>
          <span className="tracking-tight font-extrabold text-white">
            ZIMAX<span className="text-purple-400">CEX</span>
          </span>
        </a>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
          <span className="text-purple-400 font-medium">Polygon PoS</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-slate-300">
            {networkStatus?.gasPriceGwei ? `${networkStatus.gasPriceGwei} Gwei` : '32 Gwei'}
          </span>
        </div>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setCurrentTab('swap')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
            currentTab === 'swap'
              ? 'text-white border-b-2 border-purple-500 font-semibold'
              : ''
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-purple-400" />
          <span>Zero-Fee Swap</span>
        </button>

        <button
          onClick={() => setCurrentTab('trade')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
            currentTab === 'trade'
              ? 'text-white border-b-2 border-purple-500 font-semibold'
              : ''
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Spot Trading</span>
        </button>

        <button
          onClick={() => setCurrentTab('assets')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
            currentTab === 'assets'
              ? 'text-white border-b-2 border-purple-500 font-semibold'
              : ''
          }`}
        >
          <Wallet className="w-4 h-4 text-blue-400" />
          <span>Custodial Assets</span>
        </button>

        <button
          onClick={() => setCurrentTab('explorer')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
            currentTab === 'explorer'
              ? 'text-white border-b-2 border-purple-500 font-semibold'
              : ''
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>Polygon RPC Live</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action + account indicator */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Balance Preview */}
        <div className="hidden xl:flex items-center gap-3 text-xs text-slate-300 bg-[#121721] px-3 py-1.5 rounded-lg border border-[#1e2638]">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">POL:</span>
            <span className="font-mono tabular-nums font-semibold text-white">
              {balances.pol.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">ZIMAX:</span>
            <span className="font-mono tabular-nums font-semibold text-purple-300">
              {balances.zimax.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
        </div>

        {/* External Web3 Wallet Button */}
        {connectedWallet ? (
          <button
            onClick={disconnectWallet}
            title="Click to disconnect external wallet"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 bg-[#141b29] hover:bg-[#1b2438] border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono tabular-nums">
              {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
            </span>
          </button>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#141b29] hover:bg-[#1c2438] border border-[#252f47] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Wallet className="w-3.5 h-3.5 text-purple-400" />
            <span>Connect Web3</span>
          </button>
        )}

        {/* Primary Action Button: Deposit */}
        <button
          onClick={openDepositModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          Deposit Tokens
        </button>

        <button
          onClick={openWithdrawModal}
          className="hidden sm:inline-flex px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#121721] hover:bg-[#1b2333] border border-[#1e2638] rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Send / Withdraw
        </button>
      </div>
    </header>
  );
};
