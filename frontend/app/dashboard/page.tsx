'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PieChart,
  Filter,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { investmentsApi } from '@/lib/api';
import { isAuthenticated, getUser } from '@/lib/auth';
import type { PortfolioOverview, EarningsData, InvestmentType } from '@/lib/types';
import toast from 'react-hot-toast';

const COLORS = {
  stocks: '#3B82F6',
  crypto: '#8B5CF6',
  shares: '#10B981',
  gold: '#F59E0B',
  real_estate: '#EF4444',
  bonds: '#6366F1',
  other: '#9CA3AF',
};

const INVESTMENT_TYPE_LABELS = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  shares: 'Shares',
  gold: 'Gold',
  real_estate: 'Real Estate',
  bonds: 'Bonds',
  other: 'Other',
};

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<PortfolioOverview | null>(null);
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<InvestmentType | 'all'>('all');
  const [aggregateBy, setAggregateBy] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router, selectedType, aggregateBy, dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const user = getUser();
      const params: any = {};
      
      if (user) {
        params.user_id = user.id;
      }
      
      if (selectedType !== 'all') {
        params.investment_type = selectedType;
      }
      
      if (dateRange.start) {
        params.start_date = dateRange.start;
      }
      
      if (dateRange.end) {
        params.end_date = dateRange.end;
      }

      const [overviewData, earningsData] = await Promise.all([
        investmentsApi.getOverview(params),
        investmentsApi.getEarnings({ ...params, aggregate_by: aggregateBy }),
      ]);

      setOverview(overviewData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const pieChartData = overview
    ? Object.entries(overview.by_type).map(([type, data]) => ({
        name: INVESTMENT_TYPE_LABELS[type as keyof typeof INVESTMENT_TYPE_LABELS] || type,
        value: data.current_value,
        color: COLORS[type as keyof typeof COLORS] || COLORS.other,
      }))
    : [];

  if (isLoading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Dashboard</h1>
        <p className="text-gray-600">Track and analyze your investment portfolio</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as InvestmentType | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="stocks">Stocks</option>
              <option value="crypto">Crypto</option>
              <option value="shares">Shares</option>
              <option value="gold">Gold</option>
              <option value="real_estate">Real Estate</option>
              <option value="bonds">Bonds</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aggregate By
            </label>
            <select
              value={aggregateBy}
              onChange={(e) => setAggregateBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Overview Panel */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Invested</span>
            <DollarSign className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${overview?.total_invested.toLocaleString() || '0'}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Current Value</span>
            <Wallet className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${overview?.total_current_value.toLocaleString() || '0'}
          </div>
        </div>

        <div
          className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
            (overview?.total_profit_loss || 0) >= 0 ? 'border-green-500' : 'border-red-500'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total P/L</span>
            {(overview?.total_profit_loss || 0) >= 0 ? (
              <TrendingUp className="text-green-500" size={20} />
            ) : (
              <TrendingDown className="text-red-500" size={20} />
            )}
          </div>
          <div
            className={`text-2xl font-bold ${
              (overview?.total_profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {(overview?.total_profit_loss || 0) >= 0 ? '+' : ''}${Math.abs(overview?.total_profit_loss || 0).toLocaleString()}
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-gray-600">
              Unrealized: ${Math.abs(overview?.unrealized_profit_loss || 0).toLocaleString()}
            </span>
            <span className="text-gray-600">
              Realized: ${Math.abs(overview?.realized_profit_loss || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Active Positions</span>
            <PieChart className="text-purple-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {overview?.total_investments || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Currently held
          </div>
        </div>

        <div
          className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
            (overview?.realized_profit_loss || 0) >= 0 ? 'border-emerald-500' : 'border-orange-500'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Realized P/L</span>
            {(overview?.realized_profit_loss || 0) >= 0 ? (
              <TrendingUp className="text-emerald-500" size={20} />
            ) : (
              <TrendingDown className="text-orange-500" size={20} />
            )}
          </div>
          <div
            className={`text-2xl font-bold ${
              (overview?.realized_profit_loss || 0) >= 0 ? 'text-emerald-600' : 'text-orange-600'
            }`}
          >
            {(overview?.realized_profit_loss || 0) >= 0 ? '+' : ''}${Math.abs(overview?.realized_profit_loss || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            From sales
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Earnings Analysis Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="invested"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Invested ($)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="current_value"
                stroke="#10B981"
                strokeWidth={2}
                name="Current Value ($)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total_amount"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Total Quantity"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Asset Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: $${entry.value.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit/Loss Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Profit/Loss Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={earnings}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="profit_loss" fill="#8B5CF6" name="Profit/Loss" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

