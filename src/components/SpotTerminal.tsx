import React, { useState } from 'react';
import { useExchange, TokenType } from '../context/ExchangeContext';
import {
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpotTerminalProps {
  openDepositModal: () => void;
  openWithdrawModal: () => void;
}

export const SpotTerminal: React.FC<SpotTerminalProps> = ({
  openDepositModal,
  openWithdrawModal,
}) => {
  const {
    balances,
    orderBookAsks,
    orderBookBids,
    placeOrder,
    transactions,
  } = useExchange();

  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [priceInput, setPriceInput] = useState<string>('10000');
  const [amountInput, setAmountInput] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Timeframe for the chart
  const [timeframe, setTimeframe] = useState<'15M' | '1H' | '4H' | '1D'>('1H');

  const priceNum = parseFloat(priceInput) || 10000;
  const amountNum = parseFloat(amountInput) || 0;
  const totalCostPol = priceNum * amountNum;

  const currentAvailable = orderSide === 'buy' ? balances.pol : balances.zimax;

  const handlePercentage = (pct: number) => {
    if (orderSide === 'buy') {
      const polToSpend = (balances.pol * pct) / 100;
      const zimaxCanBuy = polToSpend / priceNum;
      setAmountInput(zimaxCanBuy.toFixed(4).replace(/\.?0+$/, ''));
    } else {
      const zimaxToSell = (balances.zimax * pct) / 100;
      setAmountInput(zimaxToSell.toFixed(4).replace(/\.?0+$/, ''));
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid ZIMAX amount.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await placeOrder(orderSide, priceNum, amountNum);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: orderSide === 'buy' ? ['#10b981', '#34d399'] : ['#f43f5e', '#fb7185'],
      });
      setMessage({
        type: 'success',
        text: `Order executed! ${orderSide === 'buy' ? 'Bought' : 'Sold'} ${amountNum} ZIMAX for ${totalCostPol.toLocaleString()} POL.`,
      });
      setAmountInput('1');
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to place order.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recent simulated trades feed
  const recentTrades = transactions
    .filter((t) => t.type === 'TRADE_BUY' || t.type === 'TRADE_SELL' || t.type === 'SWAP')
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* 1. Market Header Ticker Bar */}
      <div className="bg-[#121721] rounded-xl border border-[#1e2638] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              Z
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-lg">ZIMAX / POL</span>
                <span className="text-[11px] font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  Fixed 1:10000 Peg
                </span>
              </div>
              <div className="text-xs text-slate-400">Polygon Network CEX Spot</div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-white flex items-center gap-1.5">
              <span>10,000.00</span>
              <span className="text-xs text-slate-400 font-normal">POL</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+0.00% (Guaranteed Fixed Rate)</span>
            </div>
          </div>
        </div>

        {/* 24h Statistics Strip */}
        <div className="flex items-center gap-6 text-xs font-mono tabular-nums">
          <div>
            <span className="text-slate-500 block text-[11px]">24h High</span>
            <span className="text-slate-200 font-medium">10,000.00 POL</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">24h Low</span>
            <span className="text-slate-200 font-medium">10,000.00 POL</span>
          </div>
          <div className="hidden md:block">
            <span className="text-slate-500 block text-[11px]">24h Volume (ZIMAX)</span>
            <span className="text-purple-300 font-medium">84,520.40 ZIMAX</span>
          </div>
          <div className="hidden lg:block">
            <span className="text-slate-500 block text-[11px]">Internal Trading Fee</span>
            <span className="text-emerald-400 font-bold">0.00% (Free)</span>
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Chart + Orderbook + Order Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Chart & Trades (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Chart Card */}
          <div className="bg-[#121721] rounded-xl border border-[#1e2638] p-4 flex flex-col h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2438] mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Price Chart</span>
                <span className="text-[11px] text-slate-500 font-mono">1 ZIMAX = 10,000 POL</span>
              </div>
              <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-lg border border-[#1a2233]">
                {(['15M', '1H', '4H', '1D'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                      timeframe === tf
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Visual Trading Chart with Candlesticks and Depth Floor */}
            <div className="flex-1 relative flex items-center justify-center bg-[#0b0e14] rounded-lg p-3 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 700 280">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="50" x2="700" y2="50" stroke="#161e2e" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="700" y2="120" stroke="#1c2538" strokeDasharray="3 3" />
                <line x1="0" y1="190" x2="700" y2="190" stroke="#161e2e" strokeDasharray="3 3" />

                {/* Price labels on right */}
                <text x="640" y="54" fill="#64748b" fontSize="10" fontFamily="monospace">10,005</text>
                <text x="640" y="124" fill="#a855f7" fontSize="10" fontFamily="monospace" fontWeight="bold">10,000</text>
                <text x="640" y="194" fill="#64748b" fontSize="10" fontFamily="monospace">9,995</text>

                {/* Area under curve */}
                <path
                  d="M 20 120 Q 80 118, 140 120 T 260 122 T 380 119 T 500 120 T 630 120 L 630 260 L 20 260 Z"
                  fill="url(#areaGrad)"
                />

                {/* Main Price Line */}
                <path
                  d="M 20 120 Q 80 118, 140 120 T 260 122 T 380 119 T 500 120 T 630 120"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                />

                {/* Candlestick Glyphs */}
                {[
                  { x: 50, open: 121, close: 119, high: 115, low: 124, green: true },
                  { x: 100, open: 119, close: 122, high: 117, low: 125, green: false },
                  { x: 150, open: 122, close: 120, high: 118, low: 123, green: true },
                  { x: 200, open: 120, close: 119, high: 116, low: 122, green: true },
                  { x: 250, open: 119, close: 121, high: 117, low: 123, green: false },
                  { x: 300, open: 121, close: 120, high: 118, low: 122, green: true },
                  { x: 350, open: 120, close: 120, high: 117, low: 122, green: true },
                  { x: 400, open: 120, close: 119, high: 116, low: 121, green: true },
                  { x: 450, open: 119, close: 121, high: 118, low: 123, green: false },
                  { x: 500, open: 121, close: 120, high: 117, low: 122, green: true },
                  { x: 550, open: 120, close: 120, high: 118, low: 121, green: true },
                  { x: 600, open: 120, close: 120, high: 119, low: 121, green: true },
                ].map((c, i) => (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={c.x}
                      y1={c.high}
                      x2={c.x}
                      y2={c.low}
                      stroke={c.green ? '#10b981' : '#f43f5e'}
                      strokeWidth="1.5"
                    />
                    {/* Body */}
                    <rect
                      x={c.x - 4}
                      y={Math.min(c.open, c.close)}
                      width="8"
                      height={Math.max(Math.abs(c.close - c.open), 2)}
                      fill={c.green ? '#10b981' : '#f43f5e'}
                      rx="1"
                    />
                  </g>
                ))}

                {/* Live Current Price Marker */}
                <circle cx="630" cy="120" r="4" fill="#a855f7" />
                <circle cx="630" cy="120" r="8" fill="#a855f7" opacity="0.3" />
              </svg>

              <div className="absolute top-4 left-4 bg-[#121721]/90 backdrop-blur border border-[#1e2638] px-2.5 py-1.5 rounded-md text-[11px] font-mono text-slate-300">
                POL Rate: <span className="text-purple-400 font-bold">10,000.00</span> | Peg: Fixed Zero-Fee
              </div>
            </div>
          </div>

          {/* Recent Trades Table */}
          <div className="bg-[#121721] rounded-xl border border-[#1e2638] p-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c2438] mb-2">
              <span className="text-xs font-semibold text-slate-300">Live Execution Log</span>
              <span className="text-[11px] text-slate-500 font-mono">Real-time CEX Activity</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono tabular-nums">
                <thead>
                  <tr className="text-slate-500 border-b border-[#171e2e] text-[11px]">
                    <th className="py-1.5 text-left font-medium">Type</th>
                    <th className="py-1.5 text-right font-medium">Price (POL)</th>
                    <th className="py-1.5 text-right font-medium">Amount (ZIMAX)</th>
                    <th className="py-1.5 text-right font-medium">Total (POL)</th>
                    <th className="py-1.5 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141b29]">
                  {recentTrades.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#151c2b] transition-colors">
                      <td className="py-1.5 text-left">
                        <span
                          className={`font-semibold ${
                            tx.type === 'TRADE_BUY' || (tx.type === 'SWAP' && tx.toToken === 'ZIMAX')
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'TRADE_BUY'
                            ? 'BUY'
                            : tx.type === 'TRADE_SELL'
                            ? 'SELL'
                            : 'SWAP'}
                        </span>
                      </td>
                      <td className="py-1.5 text-right text-slate-200 font-medium">
                        10,000.00
                      </td>
                      <td className="py-1.5 text-right text-slate-300">
                        {tx.toToken === 'ZIMAX' ? tx.toAmount : tx.fromAmount}
                      </td>
                      <td className="py-1.5 text-right text-slate-400">
                        {tx.toToken === 'POL' ? tx.toAmount.toLocaleString() : tx.fromAmount.toLocaleString()}
                      </td>
                      <td className="py-1.5 text-right text-slate-500 text-[11px]">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Middle: Order Book (2.5 cols on desktop) */}
        <div className="lg:col-span-2 bg-[#121721] rounded-xl border border-[#1e2638] p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1c2438] mb-2 text-xs">
              <span className="font-semibold text-slate-300">Order Book</span>
              <span className="text-[11px] text-slate-500 font-mono">POL / ZIMAX</span>
            </div>

            {/* Asks (Sell Orders) */}
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Price</span>
                <span>Size</span>
              </div>
              {orderBookAsks.slice().reverse().map((ask) => (
                <div
                  key={ask.id}
                  className="relative flex justify-between text-xs font-mono tabular-nums py-0.5 px-1 hover:bg-rose-950/20 rounded cursor-pointer"
                  onClick={() => {
                    setPriceInput(ask.price.toString());
                    setOrderSide('buy');
                  }}
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-rose-500/10 rounded pointer-events-none"
                    style={{ width: `${ask.percentage}%` }}
                  />
                  <span className="text-rose-400 font-medium relative z-10">{ask.price}</span>
                  <span className="text-slate-300 relative z-10">{ask.amount}</span>
                </div>
              ))}
            </div>

            {/* Current Mid Market Price */}
            <div className="py-2 px-2 my-1 bg-[#0b0e14] rounded-lg border border-[#1b2336] flex items-center justify-between">
              <span className="text-emerald-400 font-bold font-mono text-sm tabular-nums">
                10,000.00 POL
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Peg Spread: 0.00</span>
            </div>

            {/* Bids (Buy Orders) */}
            <div className="space-y-1 mt-2">
              {orderBookBids.map((bid) => (
                <div
                  key={bid.id}
                  className="relative flex justify-between text-xs font-mono tabular-nums py-0.5 px-1 hover:bg-emerald-950/20 rounded cursor-pointer"
                  onClick={() => {
                    setPriceInput(bid.price.toString());
                    setOrderSide('sell');
                  }}
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-emerald-500/10 rounded pointer-events-none"
                    style={{ width: `${bid.percentage}%` }}
                  />
                  <span className="text-emerald-400 font-medium relative z-10">{bid.price}</span>
                  <span className="text-slate-300 relative z-10">{bid.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 border-t border-[#1c2438] pt-2 mt-2 flex justify-between">
            <span>Free Swap Rate</span>
            <span className="text-purple-400 font-mono font-semibold">1 : 10,000</span>
          </div>
        </div>

        {/* Right: Place Order Form (2.5 cols) */}
        <div className="lg:col-span-3 bg-[#121721] rounded-xl border border-[#1e2638] p-4 flex flex-col justify-between">
          <div>
            {/* Buy / Sell Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#0b0e14] rounded-lg border border-[#1a2233] mb-4">
              <button
                type="button"
                onClick={() => setOrderSide('buy')}
                className={`py-2 text-xs font-bold rounded-md transition-colors ${
                  orderSide === 'buy'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Buy ZIMAX
              </button>
              <button
                type="button"
                onClick={() => setOrderSide('sell')}
                className={`py-2 text-xs font-bold rounded-md transition-colors ${
                  orderSide === 'sell'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sell ZIMAX
              </button>
            </div>

            {/* Order Type Tabs */}
            <div className="flex items-center gap-2 mb-3 text-xs">
              <button
                type="button"
                onClick={() => setOrderType('limit')}
                className={`px-3 py-1 rounded transition-colors ${
                  orderType === 'limit'
                    ? 'bg-[#1b2438] text-white font-medium'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Limit
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderType('market');
                  setPriceInput('10000');
                }}
                className={`px-3 py-1 rounded transition-colors ${
                  orderType === 'market'
                    ? 'bg-[#1b2438] text-white font-medium'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Market (Instant)
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-3">
              {/* Available Balance */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Available</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {currentAvailable.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                  {orderSide === 'buy' ? 'POL' : 'ZIMAX'}
                </span>
              </div>

              {/* Price Field */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Price (POL)</label>
                <div className="flex items-center bg-[#0b0e14] border border-[#1a2233] rounded-lg px-3 py-2 focus-within:border-purple-500/50">
                  <input
                    type="number"
                    disabled={orderType === 'market'}
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full bg-transparent font-mono tabular-nums text-sm font-semibold text-white focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 font-mono shrink-0">POL</span>
                </div>
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Amount (ZIMAX)</label>
                <div className="flex items-center bg-[#0b0e14] border border-[#1a2233] rounded-lg px-3 py-2 focus-within:border-purple-500/50">
                  <input
                    type="number"
                    step="any"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full bg-transparent font-mono tabular-nums text-sm font-semibold text-white focus:outline-none"
                    placeholder="0.00"
                  />
                  <span className="text-xs text-slate-500 font-mono shrink-0">ZIMAX</span>
                </div>
              </div>

              {/* Slider / Percentages */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentage(pct)}
                    className="py-1 text-[11px] font-mono text-slate-400 hover:text-white bg-[#0b0e14] hover:bg-[#161e2e] border border-[#1a2233] rounded transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Total POL */}
              <div className="bg-[#0b0e14] p-3 rounded-lg border border-[#1a2233] space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Order Total:</span>
                  <span className="font-mono tabular-nums font-bold text-white">
                    {totalCostPol.toLocaleString(undefined, { maximumFractionDigits: 2 })} POL
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Trading Fee:</span>
                  <span className="font-mono text-emerald-400 font-medium">0.00 POL (Free)</span>
                </div>
              </div>

              {message && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                      : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{message.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || amountNum <= 0}
                className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all ${
                  orderSide === 'buy'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting
                  ? 'Executing...'
                  : `${orderSide === 'buy' ? 'Buy' : 'Sell'} ZIMAX`}
              </button>
            </form>
          </div>

          {/* Quick links to Deposit/Withdraw */}
          <div className="mt-4 pt-3 border-t border-[#1c2438] flex items-center justify-between text-xs">
            <button
              onClick={openDepositModal}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              + Deposit Funds
            </button>
            <button
              onClick={openWithdrawModal}
              className="text-slate-400 hover:text-slate-200"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
