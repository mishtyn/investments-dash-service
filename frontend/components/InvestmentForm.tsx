'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Investment, InvestmentCreate, InvestmentUpdate, InvestmentType } from '@/lib/types';

interface InvestmentFormProps {
  investment?: Investment | null;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function InvestmentForm({ investment, onSubmit, onClose }: InvestmentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    investment_type: 'stocks' as InvestmentType,
    amount: '',
    purchase_price: '',
    current_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (investment) {
      setFormData({
        name: investment.name,
        symbol: investment.symbol,
        investment_type: investment.investment_type,
        amount: Math.abs(investment.amount).toString(), // Always show positive amount
        purchase_price: investment.purchase_price.toString(),
        current_price: investment.current_price?.toString() || '',
        purchase_date: investment.purchase_date,
        description: investment.description || '',
      });
    }
  }, [investment]);

  // Check if this is a sell transaction (amount < 0)
  const isSellTransaction = investment && investment.amount < 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: any = {
        name: formData.name,
        symbol: formData.symbol,
        investment_type: formData.investment_type,
        amount: isSellTransaction ? -Math.abs(parseFloat(formData.amount)) : parseFloat(formData.amount),
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: formData.purchase_date,
      };

      // Only add current_price for buy transactions (not for sells)
      if (!isSellTransaction && formData.current_price) {
        submitData.current_price = parseFloat(formData.current_price);
      }

      if (formData.description) {
        submitData.description = formData.description;
      }

      await onSubmit(submitData);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get input classes based on filled state
  const getInputClasses = (value: string, isRequired: boolean = false) => {
    const baseClasses = "w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {investment ? (isSellTransaction ? 'Edit Sale' : 'Edit Purchase') : 'Add New Investment'}
            </h2>
            {isSellTransaction && (
              <p className="text-sm text-orange-600 mt-1">
                Note: This is a sell transaction (cannot change to buy)
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Investment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Type <span className="text-red-500">*</span>
            </label>
            <select
              name="investment_type"
              value={formData.investment_type}
              onChange={handleChange}
              required
              className={getInputClasses(formData.investment_type, true)}
            >
              <option value="stocks">Stocks</option>
              <option value="crypto">Crypto</option>
              <option value="shares">Shares</option>
              <option value="gold">Gold</option>
              <option value="real_estate">Real Estate</option>
              <option value="bonds">Bonds</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Name and Symbol Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Apple Inc."
                className={getInputClasses(formData.name, true)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol/Ticker <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                required
                placeholder="e.g., AAPL"
                className={getInputClasses(formData.symbol, true)}
              />
            </div>
          </div>

          {/* Amount and Purchase Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount/Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                step="0.0001"
                min="0"
                placeholder="e.g., 10"
                className={getInputClasses(formData.amount, true)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isSellTransaction ? 'Sale Price (per unit)' : 'Purchase Price (per unit)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                placeholder={isSellTransaction ? "e.g., 160.00" : "e.g., 150.00"}
                className={getInputClasses(formData.purchase_price, true)}
              />
            </div>
          </div>

          {/* Current Price and Purchase Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isSellTransaction && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Price (per unit)
                </label>
                <input
                  type="number"
                  name="current_price"
                  value={formData.current_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="e.g., 175.50"
                  className={getInputClasses(formData.current_price, false)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use purchase price
                </p>
              </div>
            )}

            <div className={isSellTransaction ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isSellTransaction ? 'Sale Date' : 'Purchase Date'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                required
                className={getInputClasses(formData.purchase_date, true)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Add any notes or details about this investment..."
              className={`${getInputClasses(formData.description, false)} resize-none`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum 1000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>
                  {investment 
                    ? (isSellTransaction ? 'Update Sale' : 'Update Purchase')
                    : 'Add Investment'
                  }
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

