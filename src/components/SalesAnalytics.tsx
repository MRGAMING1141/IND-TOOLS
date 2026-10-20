import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Order } from '../types';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Package,
  CheckCircle2,
  Percent,
} from 'lucide-react';

interface SalesAnalyticsProps {
  orders: Order[];
}

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ orders }) => {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(30);
  const [metricView, setMetricView] = useState<'both' | 'revenue' | 'orders'>('both');

  // Compute daily metrics over the selected number of days
  const chartData = useMemo(() => {
    const days = timeRange;
    const now = new Date();
    const result: {
      date: string;
      fullDate: string;
      revenue: number;
      orders: number;
      approvedOrders: number;
    }[] = [];

    // Map of YYYY-MM-DD -> { revenue, orders, approvedOrders }
    const dailyMap = new Map<string, { revenue: number; orders: number; approvedOrders: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dailyMap.set(isoKey, { revenue: 0, orders: 0, approvedOrders: 0 });
      result.push({
        date: displayDate,
        fullDate: isoKey,
        revenue: 0,
        orders: 0,
        approvedOrders: 0,
      });
    }

    orders.forEach((o) => {
      let orderDate: Date | null = null;
      if (o.createdAt?.toDate) {
        orderDate = o.createdAt.toDate();
      } else if (o.createdAt) {
        orderDate = new Date(o.createdAt);
      }

      if (!orderDate || isNaN(orderDate.getTime())) return;

      const iso = orderDate.toISOString().split('T')[0];
      const entry = dailyMap.get(iso);
      if (entry) {
        entry.orders += 1;
        if (o.status === 'approved' || o.status === 'completed') {
          entry.revenue += o.amount || 0;
          entry.approvedOrders += 1;
        }
      }
    });

    return result.map((item) => {
      const computed = dailyMap.get(item.fullDate) || { revenue: 0, orders: 0, approvedOrders: 0 };
      return {
        ...item,
        revenue: computed.revenue,
        orders: computed.orders,
        approvedOrders: computed.approvedOrders,
      };
    });
  }, [orders, timeRange]);

  // Aggregate summary stats for the selected time range
  const summary = useMemo(() => {
    const totalRev = chartData.reduce((acc, d) => acc + d.revenue, 0);
    const totalOrd = chartData.reduce((acc, d) => acc + d.orders, 0);
    const totalApproved = chartData.reduce((acc, d) => acc + d.approvedOrders, 0);
    const aov = totalApproved > 0 ? Math.round(totalRev / totalApproved) : 0;
    const approvalRate = totalOrd > 0 ? Math.round((totalApproved / totalOrd) * 100) : 0;

    return {
      revenue: totalRev,
      orders: totalOrd,
      approvedOrders: totalApproved,
      aov,
      approvalRate,
    };
  }, [chartData]);

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-5 shadow-2xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sales Revenue & Processing Trends
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Daily order flow and verified revenue over the last {timeRange} days
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Metric View Toggle */}
          <div className="flex bg-white/[0.03] backdrop-blur-md p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setMetricView('both')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                metricView === 'both' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setMetricView('revenue')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                metricView === 'revenue' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Revenue (₹)
            </button>
            <button
              onClick={() => setMetricView('orders')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                metricView === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Orders
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-white/[0.03] backdrop-blur-md p-1 rounded-xl border border-white/[0.08]">
            {([7, 14, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  timeRange === r ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 30-Day Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">
            {timeRange}-Day Revenue
          </span>
          <span className="text-lg font-bold text-emerald-400 font-mono">
            ₹{summary.revenue.toLocaleString()}
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">
            {timeRange}-Day Total Orders
          </span>
          <span className="text-lg font-bold text-white font-mono">
            {summary.orders}
          </span>
          <span className="text-[10px] text-slate-500 block">
            ({summary.approvedOrders} approved)
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">
            Avg Order Value (AOV)
          </span>
          <span className="text-lg font-bold text-blue-400 font-mono">
            ₹{summary.aov}
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">
            Approval Rate
          </span>
          <span className="text-lg font-bold text-purple-400 font-mono">
            {summary.approvalRate}%
          </span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>

            <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            {(metricView === 'both' || metricView === 'revenue') && (
              <YAxis
                yAxisId="left"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
            )}

            {(metricView === 'both' || metricView === 'orders') && (
              <YAxis
                yAxisId="right"
                orientation={metricView === 'both' ? 'right' : 'left'}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0]?.payload;
                return (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs shadow-xl space-y-1.5 min-w-[150px]">
                    <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800">
                      {label}
                    </div>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Revenue:</span>
                      <span className="font-mono font-bold">₹{data?.revenue?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-blue-400">
                      <span>Total Orders:</span>
                      <span className="font-mono font-bold">{data?.orders}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Approved:</span>
                      <span className="font-mono">{data?.approvedOrders}</span>
                    </div>
                  </div>
                );
              }}
            />

            {(metricView === 'both' || metricView === 'revenue') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue (₹)"
                stroke="#10B981"
                strokeWidth={2}
                fill="#10B981"
                fillOpacity={0.12}
              />
            )}

            {(metricView === 'both' || metricView === 'orders') && (
              <Bar
                yAxisId="right"
                dataKey="orders"
                name="Orders Placed"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                barSize={timeRange === 7 ? 20 : timeRange === 14 ? 12 : 7}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
