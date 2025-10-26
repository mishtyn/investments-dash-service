'use client';

import { useState, useEffect } from 'react';
import { investmentsApi } from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { AvailablePosition, InvestmentSell } from '@/lib/types';
import toast from 'react-hot-toast';
import { TrendingDown, AlertCircle, DollarSign, Package } from 'lucide-react';

interface InvestmentSellFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function InvestmentSellForm({ onSuccess, onCancel }: InvestmentSellFormProps) {
  const [positions, setPositions] = useState<AvailablePosition[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<AvailablePosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    sale_price: '',
    sale_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    fetchAvailablePositions();
  }, []);

  const fetchAvailablePositions = async () => {
    try {
      const user = getUser();
      const params = user ? { user_id: user.id } : {};
      const data = await investmentsApi.getAvailablePositions(params);
      setPositions(data);
      
      if (data.length === 0) {
        toast.error('No positions available to sell');
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast.error('Failed to load available positions');
    }
  };

  const handlePositionSelect = (position: AvailablePosition) => {
    setSelectedPosition(position);
    setFormData({
      ...formData,
      sale_price: position.current_price?.toString() || position.average_purchase_price.toString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPosition) {
      toast.error('Please select a position to sell');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (amount > selectedPosition.available_amount) {
      toast.error(`Insufficient amount. Available: ${selectedPosition.available_amount}`);
      return;
    }

    const salePrice = parseFloat(formData.sale_price);
    if (salePrice <= 0) {
      toast.error('Sale price must be greater than 0');
      return;
    }

    setIsLoading(true);
    try {
      const user = getUser();
      const sellData: InvestmentSell = {
        user_id: user?.id,
        symbol: selectedPosition.symbol,
        amount: amount,
        sale_price: salePrice,
        sale_date: formData.sale_date,
        description: formData.description || undefined,
      };

      await investmentsApi.sell(sellData);
      
      const profitLoss = (salePrice - selectedPosition.average_purchase_price) * amount;
      toast.success(
        `Successfully sold ${amount} ${selectedPosition.symbol} for $${(salePrice * amount).toFixed(2)}. ` +
        `${profitLoss >= 0 ? 'Profit' : 'Loss'}: $${Math.abs(profitLoss).toFixed(2)}`
      );
      
      // Reset form
      setFormData({
        amount: '',
        sale_price: '',
        sale_date: new Date().toISOString().split('T')[0],
        description: '',
      });
      setSelectedPosition(null);
      
      // Refresh positions
      await fetchAvailablePositions();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error selling investment:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to sell investment';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get input classes based on filled state
  const getInputClasses = (value: string, isRequired: boolean = false) => {
    const baseClasses = "w-full px-4 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-transparent";
    
    if (value && value.trim() !== '') {
      // Filled state - green tint with black text
      return `${baseClasses} bg-green-50 border-green-300 text-gray-900 font-medium`;
    } else if (isRequired) {
      // Empty required field - lighter text
      return `${baseClasses} bg-white border-gray-300 hover:border-gray-400 text-gray-500`;
    } else {
      // Optional empty field - lighter text
      return `${baseClasses} bg-white border-gray-300 hover:border-gray-400 text-gray-500`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-red-100 rounded-lg">
          <TrendingDown className="text-red-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sell Investment</h2>
          <p className="text-sm text-gray-600">Select a position and specify the amount to sell</p>
        </div>
      </div>

      {/* Available Positions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Position to Sell
        </label>
        
        {positions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={48} className="mx-auto mb-2 text-gray-400" />
            <p>No positions available to sell</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {positions.map((position) => (
              <button
                key={position.symbol}
                type="button"
                onClick={() => handlePositionSelect(position)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedPosition?.symbol === position.symbol
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{position.symbol}</h3>
                    <p className="text-sm text-gray-600">{position.name}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                    {position.investment_type}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 flex items-center">
                      <Package size={14} className="mr-1" />
                      Available
                    </p>
                    <p className="font-semibold text-gray-900">{position.available_amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 flex items-center">
                      <DollarSign size={14} className="mr-1" />
                      Avg. Price
                    </p>
                    <p className="font-semibold text-gray-900">${position.average_purchase_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current Price</p>
                    <p className="font-semibold text-gray-900">
                      ${(position.current_price || position.average_purchase_price).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unrealized P/L</p>
                    <p className={`font-semibold ${position.unrealized_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {position.unrealized_profit_loss >= 0 ? '+' : ''}${position.unrealized_profit_loss.toFixed(2)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sell Form */}
      {selectedPosition && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              <strong>Selected:</strong> {selectedPosition.symbol} - {selectedPosition.name}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Available: {selectedPosition.available_amount} units
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Sell *
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={getInputClasses(formData.amount, true)}
                placeholder="0.0"
                required
                max={selectedPosition.available_amount}
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: {selectedPosition.available_amount}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price per Unit *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                className={getInputClasses(formData.sale_price, true)}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: ${(selectedPosition.current_price || selectedPosition.average_purchase_price).toFixed(2)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Date *
            </label>
            <input
              type="date"
              value={formData.sale_date}
              onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
              className={getInputClasses(formData.sale_date, true)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${getInputClasses(formData.description, false)} resize-none`}
              rows={3}
              placeholder="Add notes about this sale..."
            />
          </div>

          {/* Estimated Profit/Loss */}
          {formData.amount && formData.sale_price && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Transaction Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sale Amount:</span>
                  <span className="font-semibold">{formData.amount} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sale Price:</span>
                  <span className="font-semibold">${parseFloat(formData.sale_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sale Value:</span>
                  <span className="font-semibold">
                    ${(parseFloat(formData.amount) * parseFloat(formData.sale_price)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Cost Basis:</span>
                  <span className="font-semibold">
                    ${(parseFloat(formData.amount) * selectedPosition.average_purchase_price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated P/L:</span>
                  <span className={`font-semibold ${
                    (parseFloat(formData.sale_price) - selectedPosition.average_purchase_price) * parseFloat(formData.amount) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {((parseFloat(formData.sale_price) - selectedPosition.average_purchase_price) * parseFloat(formData.amount) >= 0 ? '+' : '')}
                    ${((parseFloat(formData.sale_price) - selectedPosition.average_purchase_price) * parseFloat(formData.amount)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <TrendingDown size={20} className="mr-2" />
                  Confirm Sale
                </>
              )}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

