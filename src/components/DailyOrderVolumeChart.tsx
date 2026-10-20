import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Order } from '../types';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface DailyOrderVolumeChartProps {
  orders: Order[];
}

export type BarChartMode = 'stacked' | 'total';

export const DailyOrderVolumeChart: React.FC<DailyOrderVolumeChartProps> = ({ orders }) => {
  const [timeRange, setTimeRange] = useState<30 | 14 | 7>(30);
  const [chartMode, setChartMode] = useState<BarChartMode>('stacked');
  const [showAverageLine, setShowAverageLine] = useState(true);

  // Helper to safely parse any Firestore timestamp or Date
  const parseOrderDate = (createdAt: any): Date | null => {
    if (!createdAt) return null;
    if (createdAt instanceof Date) return createdAt;
    if (typeof createdAt.toDate === 'function') {
      try {
        return createdAt.toDate();
      } catch {
        // fallback
      }
    }
    if (typeof createdAt.seconds === 'number') {
      return new Date(createdAt.seconds * 1000);
    }
    if (typeof createdAt === 'number') {
      return new Date(createdAt);
    }
    if (typeof createdAt === 'string') {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  // Compute continuous daily buckets over the selected time range (default 30 days)
  const chartData = useMemo(() => {
    const days = timeRange;
    const now = new Date();
    const result: Array<{
      date: string;
      fullDate: string;
      dayOfWeek: string;
      orders: number;
      completed: number;
      approved: number;
      pending: number;
      rejected: number;
      revenue: number;
    }> = [];

    // Map: YYYY-MM-DD -> counts
    const dailyMap = new Map<
      string,
      {
        orders: number;
        completed: number;
        approved: number;
        pending: number;
        rejected: number;
        revenue: number;
      }
    >();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const isoKey = `${year}-${month}-${day}`;

      const displayDate = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      const dayOfWeek = d.toLocaleDateString(undefined, { weekday: 'short' });
      const fullDate = d.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      dailyMap.set(isoKey, {
        orders: 0,
        completed: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        revenue: 0,
      });

      result.push({
        date: displayDate,
        fullDate,
        dayOfWeek,
        orders: 0,
        completed: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        revenue: 0,
      });
    }

    // Populate with real orders
    orders.forEach((o) => {
      const orderDate = parseOrderDate(o.createdAt);
      if (!orderDate) return;

      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      const isoKey = `${year}-${month}-${day}`;

      const entry = dailyMap.get(isoKey);
      if (entry) {
        entry.orders += 1;
        if (o.status === 'completed') {
          entry.completed += 1;
          entry.revenue += o.amount || 0;
        } else if (o.status === 'approved') {
          entry.approved += 1;
          entry.revenue += o.amount || 0;
        } else if (o.status === 'pending') {
          entry.pending += 1;
        } else if (o.status === 'rejected') {
          entry.rejected += 1;
        }
      }
    });

    return result.map((item, index) => {
      // Find the corresponding day from dailyMap using backwards index
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - index));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const isoKey = `${year}-${month}-${day}`;

      const computed = dailyMap.get(isoKey) || {
        orders: 0,
        completed: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        revenue: 0,
      };

      return {
        ...item,
        ...computed,
      };
    });
  }, [orders, timeRange]);

  // Aggregate statistics for the time window
  const stats = useMemo(() => {
    const totalOrders = chartData.reduce((acc, d) => acc + d.orders, 0);
    const totalCompleted = chartData.reduce((acc, d) => acc + d.completed, 0);
    const totalApproved = chartData.reduce((acc, d) => acc + d.approved, 0);
    const totalPending = chartData.reduce((acc, d) => acc + d.pending, 0);
    const totalRejected = chartData.reduce((acc, d) => acc + d.rejected, 0);
    const totalRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);

    const avgDailyOrders = totalOrders / (timeRange || 1);

    // Peak volume day
    let peakDay = { date: '—', count: 0 };
    chartData.forEach((d) => {
      if (d.orders > peakDay.count) {
        peakDay = { date: `${d.date} (${d.dayOfWeek})`, count: d.orders };
      }
    });

    // Velocity / Trend comparison: first half vs second half
    const halfDays = Math.floor(chartData.length / 2);
    const firstHalfOrders = chartData.slice(0, halfDays).reduce((a, b) => a + b.orders, 0);
    const secondHalfOrders = chartData.slice(halfDays).reduce((a, b) => a + b.orders, 0);
    const velocityDiff = secondHalfOrders - firstHalfOrders;
    const velocityPercent =
      firstHalfOrders > 0
        ? Math.round(((secondHalfOrders - firstHalfOrders) / firstHalfOrders) * 100)
        : secondHalfOrders > 0
        ? 100
        : 0;

    const successfulOrders = totalCompleted + totalApproved;
    const fulfillmentRate =
      totalOrders > 0 ? Math.round((successfulOrders / totalOrders) * 100) : 100;

    return {
      totalOrders,
      totalCompleted,
      totalApproved,
      totalPending,
      totalRejected,
      totalRevenue,
      avgDailyOrders,
      peakDay,
      velocityDiff,
      velocityPercent,
      fulfillmentRate,
    };
  }, [chartData, timeRange]);

  // Maximum value for dynamic Y-axis scaling
  const maxVolume = useMemo(() => {
    const highest = Math.max(...chartData.map((d) => d.orders), 0);
    return Math.max(highest + 1, 4);
  }, [chartData]);

  return (
    <div className="glass-panel bg-white/85 border border-slate-200/90 rounded-2xl p-5 space-y-5 shadow-xs">
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Daily Order Volume Trends
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                Past {timeRange} Days
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Recharts-powered daily order volume distribution, fulfillment tracking, and velocity analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chart Display Mode: Stacked Status vs Total Volume */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setChartMode('stacked')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                chartMode === 'stacked'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View daily volume broken down by order status (Completed, Approved, Pending, Rejected)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Status Breakdown</span>
            </button>
            <button
              onClick={() => setChartMode('total')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                chartMode === 'total'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View unified total order volume bar per day"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Unified Bar</span>
            </button>
          </div>

          {/* Timeframe Selector (30 Days default) */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
            {([30, 14, 7] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}D
              </button>
            ))}
          </div>

          {/* Toggle Average Line */}
          <button
            onClick={() => setShowAverageLine(!showAverageLine)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showAverageLine
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                : 'clay-button text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle average daily volume reference line"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Avg Line</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {timeRange}-Day Volume
            </span>
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {stats.totalOrders}
            </span>
            <span className="text-[11px] text-slate-500">orders</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px]">
            {stats.velocityPercent >= 0 ? (
              <span className="text-emerald-600 flex items-center font-semibold">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +{stats.velocityPercent}% trend
              </span>
            ) : (
              <span className="text-rose-600 flex items-center font-semibold">
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                {stats.velocityPercent}% trend
              </span>
            )}
            <span className="text-slate-400">vs prior period</span>
          </div>
        </div>

        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Daily Average
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-indigo-700 font-mono">
              {stats.avgDailyOrders.toFixed(1)}
            </span>
            <span className="text-[11px] text-slate-500">orders / day</span>
          </div>
          <span className="block text-[11px] text-slate-500 mt-1">
            {stats.totalRevenue > 0
              ? `₹${Math.round(stats.totalRevenue / (timeRange || 1)).toLocaleString()}/day avg`
              : 'Consistent activity'}
          </span>
        </div>

        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Peak Day Volume
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-700 font-mono">
              {stats.peakDay.count}
            </span>
            <span className="text-[11px] text-slate-500">orders max</span>
          </div>
          <span className="block text-[11px] text-slate-500 mt-1 truncate" title={stats.peakDay.date}>
            {stats.peakDay.count > 0 ? stats.peakDay.date : 'No orders recorded yet'}
          </span>
        </div>

        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Fulfillment Rate
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700 font-mono">
              {stats.fulfillmentRate}%
            </span>
            <span className="text-[11px] text-slate-500">approved/done</span>
          </div>
          <span className="block text-[11px] text-slate-500 mt-1">
            {stats.totalPending} pending · {stats.totalRejected} rejected
          </span>
        </div>
      </div>

      {/* Main Recharts Bar Chart Viewport */}
      <div className="h-72 sm:h-80 w-full min-w-0 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
            barGap={2}
          >
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              interval={timeRange === 30 ? 2 : 0}
            />

            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, maxVolume]}
              allowDecimals={false}
              tickFormatter={(v) => `${v}`}
            />

            {/* Custom Tooltip */}
            <Tooltip
              cursor={{ fill: 'rgba(226, 232, 240, 0.45)' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;

                return (
                  <div className="glass-panel bg-white/95 border border-slate-200 rounded-xl p-3 text-xs shadow-xl space-y-2 min-w-[200px] text-slate-800">
                    <div className="pb-1.5 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{d.date}</span>
                        <span className="text-[10px] text-slate-500">
                          {d.dayOfWeek} · {d.fullDate}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {d.orders} {d.orders === 1 ? 'order' : 'orders'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-emerald-700">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Completed:
                        </span>
                        <span className="font-mono font-bold">{d.completed}</span>
                      </div>

                      <div className="flex items-center justify-between text-blue-700">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Approved:
                        </span>
                        <span className="font-mono font-bold">{d.approved}</span>
                      </div>

                      <div className="flex items-center justify-between text-amber-700">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Pending:
                        </span>
                        <span className="font-mono font-bold">{d.pending}</span>
                      </div>

                      <div className="flex items-center justify-between text-rose-700">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Rejected:
                        </span>
                        <span className="font-mono font-bold">{d.rejected}</span>
                      </div>
                    </div>

                    {d.revenue > 0 && (
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-slate-700">
                        <span className="text-[11px] text-slate-500">Verified Revenue:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ₹{d.revenue.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {showAverageLine && stats.avgDailyOrders > 0 && (
              <ReferenceLine
                y={stats.avgDailyOrders}
                stroke="#6366F1"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `30D Avg: ${stats.avgDailyOrders.toFixed(1)}`,
                  fill: '#4F46E5',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}

            {chartMode === 'stacked' ? (
              <>
                <Bar
                  dataKey="completed"
                  name="Completed"
                  stackId="volume"
                  fill="#059669"
                  radius={[0, 0, 0, 0]}
                  barSize={timeRange === 30 ? 9 : timeRange === 14 ? 16 : 24}
                />
                <Bar
                  dataKey="approved"
                  name="Approved"
                  stackId="volume"
                  fill="#2563EB"
                  radius={[0, 0, 0, 0]}
                  barSize={timeRange === 30 ? 9 : timeRange === 14 ? 16 : 24}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  stackId="volume"
                  fill="#D97706"
                  radius={[0, 0, 0, 0]}
                  barSize={timeRange === 30 ? 9 : timeRange === 14 ? 16 : 24}
                />
                <Bar
                  dataKey="rejected"
                  name="Rejected"
                  stackId="volume"
                  fill="#DC2626"
                  radius={[3, 3, 0, 0]}
                  barSize={timeRange === 30 ? 9 : timeRange === 14 ? 16 : 24}
                />
              </>
            ) : (
              <Bar
                dataKey="orders"
                name="Order Volume"
                radius={[4, 4, 0, 0]}
                barSize={timeRange === 30 ? 10 : timeRange === 14 ? 18 : 28}
              >
                {chartData.map((entry, index) => {
                  const isPeak = entry.orders > 0 && entry.orders === stats.peakDay.count;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        isPeak
                          ? '#D97706' // Amber highlight for peak day
                          : entry.orders > 0
                          ? '#2563EB' // Solid royal blue for active days
                          : '#E2E8F0' // Clean light bar for zero-volume days
                      }
                    />
                  );
                })}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Status Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            <span className="text-slate-700 font-medium">Completed ({stats.totalCompleted})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
            <span className="text-slate-700 font-medium">Approved ({stats.totalApproved})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-600" />
            <span className="text-slate-700 font-medium">Pending ({stats.totalPending})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
            <span className="text-slate-700 font-medium">Rejected ({stats.totalRejected})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Continuous 30-day timeline synced via Firestore</span>
        </div>
      </div>
    </div>
  );
};
