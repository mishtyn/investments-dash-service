'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { investmentsApi } from '@/lib/api';
import { isAuthenticated, getUser } from '@/lib/auth';
import type { Investment, InvestmentType, InvestmentCreate, InvestmentUpdate } from '@/lib/types';
import toast from 'react-hot-toast';
import InvestmentForm from '@/components/InvestmentForm';

const INVESTMENT_TYPE_LABELS = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  shares: 'Shares',
  gold: 'Gold',
  real_estate: 'Real Estate',
  bonds: 'Bonds',
  other: 'Other',
};

const INVESTMENT_TYPE_COLORS = {
  stocks: 'bg-blue-100 text-blue-800',
  crypto: 'bg-purple-100 text-purple-800',
  shares: 'bg-green-100 text-green-800',
  gold: 'bg-yellow-100 text-yellow-800',
  real_estate: 'bg-red-100 text-red-800',
  bonds: 'bg-indigo-100 text-indigo-800',
  other: 'bg-gray-100 text-gray-800',
};

export default function InvestmentsPage() {
  const router = useRouter();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<InvestmentType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchInvestments();
  }, [router, typeFilter]);

  const fetchInvestments = async () => {
    setIsLoading(true);
    try {
      const user = getUser();
      const params: any = {};
      
      if (user) {
        params.user_id = user.id;
      }
      
      if (typeFilter !== 'all') {
        params.investment_type = typeFilter;
      }

      const data = await investmentsApi.getAll(params);
      setInvestments(data);
    } catch (error) {
      console.error('Error fetching investments:', error);
      toast.error('Failed to load investments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: InvestmentCreate) => {
    try {
      const user = getUser();
      if (user) {
        data.user_id = user.id;
      }
      await investmentsApi.create(data);
      toast.success('Investment created successfully!');
      setShowForm(false);
      fetchInvestments();
    } catch (error) {
      console.error('Error creating investment:', error);
      toast.error('Failed to create investment');
      throw error;
    }
  };

  const handleUpdate = async (data: InvestmentUpdate) => {
    if (!editingInvestment) return;
    try {
      await investmentsApi.update(editingInvestment.id, data);
      toast.success('Investment updated successfully!');
      setEditingInvestment(null);
      setShowForm(false);
      fetchInvestments();
    } catch (error) {
      console.error('Error updating investment:', error);
      toast.error('Failed to update investment');
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;
    
    try {
      await investmentsApi.delete(id);
      toast.success('Investment deleted successfully!');
      fetchInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
      toast.error('Failed to delete investment');
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInvestment(null);
  };

  const filteredInvestments = investments.filter(
    (inv) =>
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateProfit = (investment: Investment) => {
    const currentPrice = investment.current_price || investment.purchase_price;
    return (currentPrice - investment.purchase_price) * investment.amount;
  };

  const calculateProfitPercentage = (investment: Investment) => {
    if (!investment.current_price) return 0;
    return ((investment.current_price - investment.purchase_price) / investment.purchase_price) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Investments</h1>
          <p className="text-gray-600">Add, edit, or remove your investments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
        >
          <Plus size={20} />
          <span className="font-medium">Add Investment</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as InvestmentType | 'all')}
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
        </div>
      </div>

      {/* Investments List */}
      {filteredInvestments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Plus size={48} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No investments yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first investment</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            Add Your First Investment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInvestments.map((investment) => {
            const profit = calculateProfit(investment);
            const profitPercentage = calculateProfitPercentage(investment);
            const isProfit = profit >= 0;

            return (
              <div
                key={investment.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{investment.name}</h3>
                      <span className="text-gray-500 font-mono">{investment.symbol}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          INVESTMENT_TYPE_COLORS[investment.investment_type]
                        }`}
                      >
                        {INVESTMENT_TYPE_LABELS[investment.investment_type]}
                      </span>
                    </div>

                    {investment.description && (
                      <p className="text-gray-600 mb-3">{investment.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block">Amount</span>
                        <span className="font-semibold text-gray-900">{investment.amount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Purchase Price</span>
                        <span className="font-semibold text-gray-900">
                          ${investment.purchase_price.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Current Price</span>
                        <span className="font-semibold text-gray-900">
                          ${(investment.current_price || investment.purchase_price).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Profit/Loss</span>
                        <div className="flex items-center space-x-1">
                          {isProfit ? (
                            <TrendingUp size={16} className="text-green-500" />
                          ) : (
                            <TrendingDown size={16} className="text-red-500" />
                          )}
                          <span
                            className={`font-semibold ${
                              isProfit ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            ${Math.abs(profit).toFixed(2)} ({profitPercentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 block flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>Purchase Date</span>
                        </span>
                        <span className="font-semibold text-gray-900">
                          {new Date(investment.purchase_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(investment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(investment.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Investment Form Modal */}
      {showForm && (
        <InvestmentForm
          investment={editingInvestment}
          onSubmit={editingInvestment ? handleUpdate : handleCreate}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

