import React, { useState } from 'react';
import { ExchangeProvider, TokenType } from './context/ExchangeContext';
import { TopNav } from './components/TopNav';
import { SwapModule } from './components/SwapModule';
import { SpotTerminal } from './components/SpotTerminal';
import { AssetsOverview } from './components/AssetsOverview';
import { ExternalWalletHub } from './components/ExternalWalletHub';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { ExternalLink, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { ZIMAX_CONTRACT_ADDRESS, POLYGON_RPC_URL } from './services/polygon';

function ExchangeApp() {
  const [currentTab, setCurrentTab] = useState<'swap' | 'trade' | 'assets' | 'explorer'>('swap');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositToken, setDepositToken] = useState<TokenType>('ZIMAX');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawToken, setWithdrawToken] = useState<TokenType>('ZIMAX');

  const handleOpenDeposit = (token: TokenType = 'ZIMAX') => {
    setDepositToken(token);
    setIsDepositOpen(true);
  };

  const handleOpenWithdraw = (token: TokenType = 'ZIMAX') => {
    setWithdrawToken(token);
    setIsWithdrawOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top Bar Navigation */}
      <TopNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openDepositModal={() => handleOpenDeposit('ZIMAX')}
        openWithdrawModal={() => handleOpenWithdraw('ZIMAX')}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'swap' && (
          <SwapModule
            openDepositModal={() => handleOpenDeposit('ZIMAX')}
            openWithdrawModal={() => handleOpenWithdraw('ZIMAX')}
          />
        )}

        {currentTab === 'trade' && (
          <SpotTerminal
            openDepositModal={() => handleOpenDeposit('ZIMAX')}
            openWithdrawModal={() => handleOpenWithdraw('ZIMAX')}
          />
        )}

        {currentTab === 'assets' && (
          <AssetsOverview
            openDepositModal={(tok) => handleOpenDeposit(tok || 'ZIMAX')}
            openWithdrawModal={(tok) => handleOpenWithdraw(tok || 'ZIMAX')}
            onNavigateSwap={() => setCurrentTab('swap')}
            onNavigateTrade={() => setCurrentTab('trade')}
          />
        )}

        {currentTab === 'explorer' && <ExternalWalletHub />}
      </main>

      {/* Modals for Send and Receive */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        defaultToken={depositToken}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        defaultToken={withdrawToken}
      />

      {/* Clean Footer */}
      <footer className="border-t border-[#182133] bg-[#080a0f] py-8 px-4 lg:px-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm">ZIMAX CEX</span>
            <span className="text-slate-600">·</span>
            <span>Polygon PoS Network (Chain ID 137)</span>
            <span className="text-slate-600">·</span>
            <span className="text-purple-400 font-mono">1 ZIMAX = 10,000 POL</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a
              href={`https://polygonscan.com/token/${ZIMAX_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-300 transition-colors inline-flex items-center gap-1"
            >
              <span>Token Contract</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700">·</span>
            <a
              href="https://polygonscan.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-200 transition-colors inline-flex items-center gap-1"
            >
              <span>PolygonScan Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ExchangeProvider>
      <ExchangeApp />
    </ExchangeProvider>
  );
}
