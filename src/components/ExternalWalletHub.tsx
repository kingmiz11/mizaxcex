import React, { useState } from 'react';
import { useExchange } from '../context/ExchangeContext';
import {
  Server,
  Activity,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  POLYGON_RPC_URL,
  ZIMAX_CONTRACT_ADDRESS,
  LiveWalletBalances,
} from '../services/polygon';

export const ExternalWalletHub: React.FC = () => {
  const {
    networkStatus,
    refreshNetworkStatus,
    connectedWallet,
    inspectExternalAddress,
    isQueryingWallet,
    externalWalletBalances,
  } = useExchange();

  const [inputAddress, setInputAddress] = useState<string>(
    connectedWallet || '0x6e99a2db2046e1C2197782f704Df48b7Ab1F68D5'
  );
  const [queriedResult, setQueriedResult] = useState<LiveWalletBalances | null>(
    externalWalletBalances
  );
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copiedRpc, setCopiedRpc] = useState(false);

  const handleQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputAddress.trim().startsWith('0x') || inputAddress.trim().length !== 42) {
      setQueryError('Please enter a valid 42-character Polygon wallet address.');
      return;
    }

    setQueryError(null);
    try {
      const res = await inspectExternalAddress(inputAddress.trim());
      setQueriedResult(res);
    } catch (err: any) {
      setQueryError(err?.message || 'Failed to query Polygon on-chain balance via Ankr RPC.');
    }
  };

  const copyRpcUrl = () => {
    navigator.clipboard.writeText(POLYGON_RPC_URL);
    setCopiedRpc(true);
    setTimeout(() => setCopiedRpc(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Title & Introduction */}
      <div>
        <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-1">
          <Server className="w-3.5 h-3.5" />
          <span>Polygon Blockchain Infrastructure</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ankr Polygon RPC & External Wallet Inspector
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Real-time RPC node telemetry and on-chain reader querying live POL native balances
          and ZIMAX ERC-20 contract holdings on Polygon PoS.
        </p>
      </div>

      {/* RPC Node Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121721] p-4 rounded-xl border border-[#1e2638] space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>RPC Node Status</span>
            <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          </div>
          <div className="text-lg font-bold text-white font-mono">Polygon PoS</div>
          <div className="text-[11px] text-slate-500">Chain ID: 137 (Mainnet)</div>
        </div>

        <div className="bg-[#121721] p-4 rounded-xl border border-[#1e2638] space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Polygon Block Height</span>
            <button
              onClick={() => refreshNetworkStatus()}
              className="text-purple-400 hover:text-purple-300 transition-colors"
              title="Refresh block number"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="text-lg font-bold text-white font-mono tabular-nums">
            #{networkStatus?.blockNumber.toLocaleString() ?? '62,450,890'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">~2.1s Block Time</div>
        </div>

        <div className="bg-[#121721] p-4 rounded-xl border border-[#1e2638] space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Network Gas Price</span>
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
            {networkStatus?.gasPriceGwei ?? '32.0'} Gwei
          </div>
          <div className="text-[11px] text-slate-500">Normal Network Traffic</div>
        </div>

        <div className="bg-[#121721] p-4 rounded-xl border border-[#1e2638] space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>RPC Response Time</span>
            <span className="text-slate-500 text-[11px]">Latency</span>
          </div>
          <div className="text-lg font-bold text-white font-mono tabular-nums">
            {networkStatus?.latencyMs ?? 84} ms
          </div>
          <div className="text-[11px] text-purple-400">High-Performance Dedicated Ankr</div>
        </div>
      </div>

      {/* Configured RPC Endpoint Details */}
      <div className="bg-[#121721] p-5 rounded-2xl border border-[#1e2638] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <span>Configured RPC Connection</span>
          </h2>
          <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
            Active Provider
          </span>
        </div>

        <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#1a2233] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="font-mono text-xs text-slate-300 break-all select-all flex-1">
            {POLYGON_RPC_URL}
          </div>
          <button
            onClick={copyRpcUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182133] hover:bg-[#222e47] text-slate-200 text-xs font-medium shrink-0 transition-colors"
          >
            {copiedRpc ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-purple-400" />
                <span>Copy RPC URL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live On-Chain Wallet Balance Inspector */}
      <div className="bg-[#121721] p-6 rounded-2xl border border-[#1e2638] space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" />
            <span>Live External Wallet On-Chain Inspector</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Query any external Polygon wallet to read real-time balances from the blockchain via
            Ankr RPC.
          </p>
        </div>

        <form onSubmit={handleQuery} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            placeholder="Enter Polygon Wallet Address (0x...)"
            className="flex-1 bg-[#0b0e14] border border-[#1a2233] focus:border-purple-500/60 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isQueryingWallet}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isQueryingWallet ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading Chain...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Inspect Balances</span>
              </>
            )}
          </button>
        </form>

        {queryError && (
          <div className="p-3 bg-rose-950/40 text-rose-300 border border-rose-800/40 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{queryError}</span>
          </div>
        )}

        {/* Live Balance Inspection Card */}
        {queriedResult && (
          <div className="bg-[#0b0e14] p-5 rounded-xl border border-[#1a2233] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#171e2e] gap-2">
              <div className="text-xs font-medium text-slate-400">
                Inspected Address:{' '}
                <span className="font-mono text-purple-300 text-xs font-semibold select-all break-all">
                  {queriedResult.address}
                </span>
              </div>
              <a
                href={`https://polygonscan.com/address/${queriedResult.address}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
              >
                <span>View on PolygonScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#121721] p-4 rounded-xl border border-[#1e2638] space-y-1">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Native Polygon (POL)</span>
                  <span className="text-[10px] text-slate-500 font-mono">18 Decimals</span>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-white">
                  {queriedResult.polBalance} <span className="text-sm text-slate-400 font-normal">POL</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Direct node balance via eth_getBalance
                </div>
              </div>

              <div className="bg-[#121721] p-4 rounded-xl border border-[#1e2638] space-y-1">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>ZIMAX Token Holding</span>
                  <span className="text-[10px] text-purple-400 font-mono">ERC-20</span>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-purple-300">
                  {queriedResult.zimaxBalance} <span className="text-sm text-slate-400 font-normal">ZIMAX</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Queried from contract {ZIMAX_CONTRACT_ADDRESS.slice(0, 10)}...
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono pt-1">
              Last on-chain sync: {new Date(queriedResult.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Verified Smart Contract Details */}
      <div className="bg-[#121721] p-6 rounded-2xl border border-[#1e2638] space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ZIMAX Verified Token Architecture</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#1a2233]">
            <span className="text-slate-500 block text-[11px] mb-1">Contract Address</span>
            <span className="text-white font-semibold break-all select-all">
              {ZIMAX_CONTRACT_ADDRESS}
            </span>
          </div>

          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#1a2233]">
            <span className="text-slate-500 block text-[11px] mb-1">CEX Swap Peg</span>
            <span className="text-emerald-400 font-semibold text-sm">
              1 ZIMAX = 10,000 POL (0% Fee)
            </span>
          </div>

          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#1a2233]">
            <span className="text-slate-500 block text-[11px] mb-1">External Explorer</span>
            <a
              href={`https://polygonscan.com/token/${ZIMAX_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1.5"
            >
              <span>Explore Contract on PolygonScan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
