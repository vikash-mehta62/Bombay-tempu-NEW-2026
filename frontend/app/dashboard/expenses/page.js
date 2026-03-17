'use client';

import { useEffect, useState } from 'react';
import { expenseAPI, vehicleAPI } from '@/lib/api';
import { Plus, Search, Filter, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import TruckLoader from '@/components/TruckLoader';

const EXPENSE_TYPES = [
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'office', label: 'Office' },
  { value: 'staff_room', label: 'Staff-room' },
  { value: 'room', label: 'Room' },
  { value: 'gopiram', label: 'Gopiram' },
  { value: 'mohit', label: 'Mohit' },
  { value: 'bills', label: 'Bills' },
  { value: 'other', label: 'Other' }
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    expenseType: '',
    vehicleId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [typeFilter, timeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.expenseType = typeFilter;
      if (timeFilter) {
        const now = new Date();
        if (timeFilter === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          params.startDate = weekAgo.toISOString();
          params.endDate = new Date().toISOString();
        } else if (timeFilter === 'month') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          params.startDate = monthAgo.toISOString();
          params.endDate = new Date().toISOString();
        }
      }
      
      const [expensesRes, statsRes, vehiclesRes] = await Promise.all([
        expenseAPI.getAll(params),
        expenseAPI.getStats(params),
        vehicleAPI.getAll()
      ]);
      
      // Filter only self-owned vehicles
      const selfOwnedVehicles = vehiclesRes.data.data.filter(
        v => v.ownershipType === 'self_owned' && v.isActive
      );
      
      setExpenses(expensesRes.data.data);
      setStats(statsRes.data.data);
      setVehicles(selfOwnedVehicles);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.expenseType) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (formData.expenseType === 'vehicle' && !formData.vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }
    
    try {
      await expenseAPI.create(formData);
      toast.success('Expense added successfully');
      setShowModal(false);
      setFormData({
        amount: '',
        expenseType: '',
        vehicleId: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await expenseAPI.delete(id);
      toast.success('Expense deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <TruckLoader size="lg" message="Loading expenses..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Dashboard</h1>
          <p className="text-gray-600">Track and manage your expenses efficiently</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadData}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700 font-medium">Total Expenses</p>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats?.totalAmount || 0)}</p>
          <p className="text-xs text-blue-600 mt-1">{stats?.totalExpenses || 0} transactions</p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700 font-medium">Weekly Expenses</p>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(stats?.weeklyTotal?.total || 0)}</p>
          <p className="text-xs text-green-600 mt-1">{stats?.weeklyTotal?.count || 0} transactions this week</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-purple-700 font-medium">Monthly Expenses</p>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats?.monthlyTotal?.total || 0)}</p>
          <p className="text-xs text-purple-600 mt-1">{stats?.monthlyTotal?.count || 0} transactions this month</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-orange-700 font-medium">Filtered Total</p>
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(stats?.totalAmount || 0)}</p>
          <p className="text-xs text-orange-600 mt-1">{expenses.length} filtered transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          <p className="text-sm text-gray-500">Filter expenses by type and time period</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              {EXPENSE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="input"
            >
              <option value="">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses by Type */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xl">📋</span>
          <h3 className="font-semibold text-gray-900">Expenses by Type</h3>
          <p className="text-sm text-gray-500">Breakdown of filtered expenses by category</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats?.byType && stats.byType.length > 0 ? (
            stats.byType.map((item) => (
              <div key={item._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700 capitalize">
                    {EXPENSE_TYPES.find(t => t.value === item._id)?.label || item._id}
                  </p>
                  <span className="text-xs text-gray-500">{item.count} transactions</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(item.totalAmount)}</p>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-500">
              No expenses found
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📝</span>
            <h3 className="font-semibold text-gray-900">Recent Expenses</h3>
            <span className="text-sm text-gray-500">{expenses.length} expenses found</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="badge bg-blue-100 text-blue-800 capitalize">
                        {EXPENSE_TYPES.find(t => t.value === expense.expenseType)?.label || expense.expenseType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {expense.vehicleId && (
                          <p className="text-sm font-medium text-gray-900">
                            {expense.vehicleId.vehicleNumber}
                          </p>
                        )}
                        {expense.notes && (
                          <p className="text-xs text-gray-500">{expense.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">💰</span>
                <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">Create a new expense entry. Fill in all the details below.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.expenseType}
                  onChange={(e) => setFormData({ ...formData, expenseType: e.target.value, vehicleId: '' })}
                  className="input"
                  required
                >
                  <option value="">Select expense type</option>
                  {EXPENSE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {formData.expenseType === 'vehicle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vehicle <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.vehicleNumber} ({vehicle.vehicleType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Add notes about this expense"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
