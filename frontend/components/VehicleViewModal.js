'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import VehicleDocumentUpload from './VehicleDocumentUpload';
import { Calendar, Truck, FileText, CreditCard, User, AlertTriangle, Bell, DollarSign, TrendingUp, TrendingDown, Download, Loader } from 'lucide-react';
import { tripAPI, tripExpenseAPI, tripAdvanceAPI, expenseAPI, vehicleAPI } from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Vehicle Expenses Tab Component
function VehicleExpensesTab({ vehicle, formatCurrency }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);
  const [transactionTab, setTransactionTab] = useState('all'); // 'all', 'income', 'expense', 'advance'
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalAdvances: 0,
    totalGeneralExpenses: 0,
    profit: 0,
    tripCount: 0
  });

  useEffect(() => {
    if (vehicle?._id) {
      loadVehicleData();
    }
  }, [vehicle]);

  const loadVehicleData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data from the vehicle expenses endpoint
      const vehicleExpensesResponse = await expenseAPI.getByVehicle(vehicle._id);
      
      console.log('Vehicle Expenses Response:', vehicleExpensesResponse.data);
      
      const { data: expenseData, stats: expenseStats } = vehicleExpensesResponse.data;
      
      // Extract data
      const vehicleTrips = expenseData.trips || [];
      const allExpenses = expenseData.tripExpenses || [];
      const allAdvances = expenseData.tripAdvances || [];
      const allGeneralExpenses = expenseData.generalExpenses || [];
      
      console.log('Vehicle Expenses - Vehicle Trips:', vehicleTrips.length, vehicleTrips.map(t => t.tripNumber));
      console.log('Vehicle Expenses - Advances loaded:', allAdvances.length, allAdvances);
      console.log('Vehicle Expenses - Trip Expenses loaded:', allExpenses.length);
      console.log('Vehicle Expenses - General Expenses loaded:', allGeneralExpenses.length);
      console.log('Vehicle Expenses - Stats from backend:', expenseStats);
      
      setTrips(vehicleTrips);
      setExpenses(allExpenses);
      setAdvances(allAdvances);
      setGeneralExpenses(allGeneralExpenses);
      setStats({
        totalIncome: expenseStats.totalIncome || 0,
        totalExpenses: expenseStats.totalTripExpenses || 0,
        totalAdvances: expenseStats.totalAdvances || 0,
        totalGeneralExpenses: expenseStats.totalGeneralExpenses || 0,
        profit: expenseStats.netProfit || 0,
        tripCount: expenseStats.tripCount || 0
      });
    } catch (error) {
      console.error('Error loading vehicle data:', error);
      toast.error('Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      // Prepare CSV data
      const headers = ['Date', 'Trip Number', 'Type', 'Description', 'Amount'];
      const rows = [];
      
      // Add income rows
      trips.forEach(trip => {
        rows.push([
          new Date(trip.loadDate).toLocaleDateString('en-IN'),
          trip.tripNumber,
          'Income',
          `Trip Revenue (${trip.clients?.length || 0} clients)`,
          trip.totalClientRevenue || 0
        ]);
      });
      
      // Add expense rows
      expenses.forEach(expense => {
        const trip = trips.find(t => t._id === expense.tripId);
        rows.push([
          new Date(expense.date).toLocaleDateString('en-IN'),
          trip?.tripNumber || 'N/A',
          'Expense',
          `${expense.expenseType} - ${expense.description || ''}`,
          -expense.amount
        ]);
      });
      
      // Add advance rows
      advances.forEach(advance => {
        const trip = trips.find(t => t._id === advance.tripId);
        rows.push([
          new Date(advance.date).toLocaleDateString('en-IN'),
          trip?.tripNumber || 'N/A',
          'Advance',
          advance.description || 'Advance payment',
          -advance.amount
        ]);
      });
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });
      
      // Add summary
      csvContent += '\n';
      csvContent += `"Total Income","","","",${stats.totalIncome}\n`;
      csvContent += `"Total Expenses","","","",${stats.totalExpenses}\n`;
      csvContent += `"Total Advances","","","",${stats.totalAdvances}\n`;
      csvContent += `"Net Profit","","","",${stats.profit}\n`;
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${vehicle.vehicleNumber}_expenses_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text(`Vehicle Expense Report`, 14, 20);
      doc.setFontSize(12);
      doc.text(`Vehicle: ${vehicle.vehicleNumber}`, 14, 28);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 35);
      
      // Summary
      doc.setFontSize(14);
      doc.text('Summary', 14, 45);
      doc.autoTable({
        startY: 50,
        head: [['Metric', 'Amount']],
        body: [
          ['Total Trips', stats.tripCount.toString()],
          ['Total Income', formatCurrency(stats.totalIncome)],
          ['Total Expenses', formatCurrency(stats.totalExpenses)],
          ['Total Advances', formatCurrency(stats.totalAdvances)],
          ['Net Profit', formatCurrency(stats.profit)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      // Transactions
      const transactions = [];
      trips.forEach(trip => {
        transactions.push([
          new Date(trip.loadDate).toLocaleDateString('en-IN'),
          trip.tripNumber,
          'Income',
          `Trip Revenue`,
          formatCurrency(trip.totalClientRevenue || 0)
        ]);
      });
      
      expenses.forEach(expense => {
        const trip = trips.find(t => t._id === expense.tripId);
        transactions.push([
          new Date(expense.date).toLocaleDateString('en-IN'),
          trip?.tripNumber || 'N/A',
          'Expense',
          `${expense.expenseType}`,
          formatCurrency(expense.amount)
        ]);
      });
      
      advances.forEach(advance => {
        const trip = trips.find(t => t._id === advance.tripId);
        transactions.push([
          new Date(advance.date).toLocaleDateString('en-IN'),
          trip?.tripNumber || 'N/A',
          'Advance',
          advance.description || 'Advance',
          formatCurrency(advance.amount)
        ]);
      });
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Date', 'Trip', 'Type', 'Description', 'Amount']],
        body: transactions,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      doc.save(`${vehicle.vehicleNumber}_expenses_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading vehicle data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700 font-medium">Total Trips</p>
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.tripCount}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700 font-medium">Total Income</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalIncome)}</p>
          <p className="text-xs text-green-600 mt-1">From {stats.tripCount} trips</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-orange-700 font-medium">Total Outflow</p>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(stats.totalExpenses + stats.totalAdvances + stats.totalGeneralExpenses)}</p>
          <p className="text-xs text-orange-600 mt-1">
            Trip Exp: {formatCurrency(stats.totalExpenses)} | Adv: {formatCurrency(stats.totalAdvances)} | Gen: {formatCurrency(stats.totalGeneralExpenses)}
          </p>
        </div>
        
        <div className={`bg-gradient-to-br p-4 rounded-lg border ${
          stats.profit >= 0 
            ? 'from-purple-50 to-purple-100 border-purple-200' 
            : 'from-red-50 to-red-100 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-medium ${stats.profit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
              Net Profit
            </p>
            <DollarSign className={`w-5 h-5 ${stats.profit >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-purple-900' : 'text-red-900'}`}>
            {stats.profit >= 0 ? '+' : ''}{formatCurrency(stats.profit)}
          </p>
          <p className={`text-xs mt-1 italic ${stats.profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            Income - Trip Exp - Advances - Gen Exp
          </p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div>
          <h4 className="font-semibold text-gray-900">Export Report</h4>
          <p className="text-sm text-gray-600">Download vehicle expense report</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportToPDF}
            className="btn bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions with Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Recent Transactions</h4>
        </div>
        
        {/* Transaction Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setTransactionTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                transactionTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({trips.length + expenses.length + advances.length + generalExpenses.length})
            </button>
            <button
              onClick={() => setTransactionTab('income')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                transactionTab === 'income'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Income ({trips.length})
            </button>
            <button
              onClick={() => setTransactionTab('expense')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                transactionTab === 'expense'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Expense ({expenses.length + generalExpenses.length})
            </button>
            <button
              onClick={() => setTransactionTab('advance')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                transactionTab === 'advance'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Advance ({advances.length})
            </button>
          </div>
        </div>
        
        {/* Transaction List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {trips.length === 0 && expenses.length === 0 && advances.length === 0 && generalExpenses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <>
              {/* Income Transactions */}
              {(transactionTab === 'all' || transactionTab === 'income') && trips.map(trip => (
                <div key={`income-${trip._id}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">INCOME</span>
                      <a 
                        href={`/trip/${trip._id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/trip/${trip._id}`;
                        }}
                      >
                        {trip.tripNumber}
                      </a>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Trip Revenue • {new Date(trip.loadDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    +{formatCurrency(trip.totalClientRevenue || 0)}
                  </p>
                </div>
              ))}
              
              {/* Expense Transactions */}
              {(transactionTab === 'all' || transactionTab === 'expense') && expenses.map(expense => {
                const trip = trips.find(t => t._id === expense.tripId);
                return (
                  <div key={`expense-${expense._id}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">TRIP EXPENSE</span>
                        <p className="text-sm font-medium text-gray-900 capitalize">{expense.expenseType}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {trip?.tripNumber && trip._id ? (
                          <>
                            <a 
                              href={`/trip/${trip._id}`}
                              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/trip/${trip._id}`;
                              }}
                            >
                              {trip.tripNumber}
                            </a>
                            {' • '}
                          </>
                        ) : ''}
                        {expense.description || 'Trip expense'} • {new Date(expense.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </p>
                  </div>
                );
              })}
              
              {/* Advance Transactions */}
              {(transactionTab === 'all' || transactionTab === 'advance') && advances.map(advance => {
                const trip = trips.find(t => t._id === advance.tripId);
                return (
                  <div key={`advance-${advance._id}`} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-bold rounded">ADVANCE</span>
                        <p className="text-sm font-medium text-gray-900">{advance.description || 'Advance Payment'}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {trip?.tripNumber && trip._id ? (
                          <a 
                            href={`/trip/${trip._id}`}
                            className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/trip/${trip._id}`;
                            }}
                          >
                            {trip.tripNumber}
                          </a>
                        ) : 'N/A'} • {advance.paymentMethod} • {new Date(advance.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-orange-600">
                      -{formatCurrency(advance.amount)}
                    </p>
                  </div>
                );
              })}
              
              {/* General Expense Transactions */}
              {(transactionTab === 'all' || transactionTab === 'expense') && generalExpenses.map(expense => {
                return (
                  <div key={`general-${expense._id}`} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">GENERAL EXPENSE</span>
                        <p className="text-sm font-medium text-gray-900 capitalize">{expense.expenseType.replace('_', ' ')}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {expense.notes || 'Vehicle expense'} • {new Date(expense.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-purple-600">
                      -{formatCurrency(expense.amount)}
                    </p>
                  </div>
                );
              })}
              
              {/* Empty state for filtered tabs */}
              {transactionTab === 'income' && trips.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No income transactions</p>
                </div>
              )}
              
              {transactionTab === 'expense' && expenses.length === 0 && generalExpenses.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No expense transactions</p>
                </div>
              )}
              
              {transactionTab === 'advance' && advances.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No advance transactions</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehicleViewModal({ isOpen, onClose, vehicle }) {
  const [activeTab, setActiveTab] = useState('details');
  
  if (!vehicle) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isExpiringSoon = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date < today;
  };

  const getExpiryBadge = (dateString) => {
    if (!dateString) return null;
    if (isExpired(dateString)) {
      return <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Expired</span>;
    }
    if (isExpiringSoon(dateString)) {
      return <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Expiring Soon</span>;
    }
    return <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Valid</span>;
  };

  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAlerts = () => {
    const alerts = [];
    const documents = [
      { name: 'Fitness Certificate', date: vehicle.fitnessExpiryDate, type: 'fitness' },
      { name: 'Insurance', date: vehicle.insuranceExpiryDate, type: 'insurance' },
      { name: 'PUC Certificate', date: vehicle.pucExpiryDate, type: 'puc' },
      { name: 'Permit', date: vehicle.permitExpiryDate, type: 'permit' },
      { name: 'National Permit', date: vehicle.nationalPermitExpiryDate, type: 'national_permit' },
      { name: 'Tax', date: vehicle.taxValidUptoDate, type: 'tax' }
    ];

    documents.forEach(doc => {
      if (doc.date) {
        const daysRemaining = getDaysRemaining(doc.date);
        if (daysRemaining !== null) {
          if (daysRemaining < 0) {
            alerts.push({
              ...doc,
              daysRemaining,
              severity: 'critical',
              message: `${doc.name} has expired ${Math.abs(daysRemaining)} days ago`
            });
          } else if (daysRemaining <= 30) {
            alerts.push({
              ...doc,
              daysRemaining,
              severity: 'warning',
              message: `${doc.name} will expire in ${daysRemaining} days`
            });
          }
        }
      }
    });

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const alerts = getAlerts();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Vehicle Details - ${vehicle.vehicleNumber}`}
      size="xl"
    >
      {/* Tab Navigation - Hide extra tabs for fleet owner vehicles */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Vehicle Details
          </button>
          {vehicle.ownershipType === 'self_owned' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'documents'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Documents Upload
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('loan')}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'loan'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Loan Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('papers')}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'papers'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Papers
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'expenses'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expenses
          </button>
          {vehicle.ownershipType === 'self_owned' && (
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors relative ${
                activeTab === 'alerts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Alerts
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Vehicle Details Tab */}
        {activeTab === 'details' && (
          <>
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Vehicle Number</p>
                  <p className="text-sm font-semibold text-gray-900">{vehicle.vehicleNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{vehicle.vehicleType.replace('_', ' ')}</p>
                </div>
                {vehicle.ownershipType === 'self_owned' && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Brand & Model</p>
                      <p className="text-sm font-medium text-gray-900">{vehicle.brand} {vehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Capacity</p>
                      <p className="text-sm font-medium text-gray-900">{vehicle.capacityTons} tons</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fuel Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{vehicle.fuelType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Year</p>
                      <p className="text-sm font-medium text-gray-900">{vehicle.year || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Color</p>
                      <p className="text-sm font-medium text-gray-900">{vehicle.color || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Engine Number</p>
                      <p className="text-sm font-medium text-gray-900">{vehicle.engineNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Chassis Number</p>
                      <p className="text-sm font-medium text-gray-900">{vehicle.chassisNumber || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Ownership</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Ownership Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{vehicle.ownershipType.replace('_', ' ')}</p>
                </div>
                {vehicle.fleetOwnerId && (
                  <div>
                    <p className="text-xs text-gray-500">Fleet Owner</p>
                    <p className="text-sm font-medium text-gray-900">
                      {vehicle.fleetOwnerId.fullName || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {vehicle.description && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{vehicle.description}</p>
              </div>
            )}
          </>
        )}

        {/* Documents Upload Tab */}
        {activeTab === 'documents' && (
          <VehicleDocumentUpload 
            vehicle={vehicle} 
            onUpdate={() => {
              // Just show success message, don't close modal
              toast.success('Document updated successfully');
            }}
            isAdminView={true}
          />
        )}

        {/* Loan Information Tab */}
        {activeTab === 'loan' && (
          <>
            {vehicle.hasLoan && vehicle.loanDetails ? (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Loan Information</h3>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Loan Amount</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(vehicle.loanDetails.loanAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">EMI Amount</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(vehicle.loanDetails.emiAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Loan Tenure</p>
                      <p className="text-sm font-bold text-gray-900">{vehicle.loanDetails.loanTenure} months</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Loan Provider</p>
                      <p className="text-sm font-bold text-gray-900">{vehicle.loanDetails.loanProvider || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-blue-200">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Elapsed Months</p>
                      <p className="text-lg font-bold text-blue-600">{vehicle.loanDetails.elapsedMonths || 0}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Total Paid</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(vehicle.loanDetails.totalPaid)}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Remaining Amount</p>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(vehicle.loanDetails.remainingAmount)}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Remaining Months</p>
                      <p className="text-lg font-bold text-purple-600">{vehicle.loanDetails.remainingMonths || 0}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">Loan Progress</span>
                      <span className="text-blue-600 font-bold">{(vehicle.loanDetails.loanProgress || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${vehicle.loanDetails.loanProgress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No Loan Information</p>
                <p className="text-gray-400 text-sm mt-2">This vehicle does not have any loan</p>
              </div>
            )}
          </>
        )}

        {/* Papers Tab */}
        {activeTab === 'papers' && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Document Expiry Dates & Uploads</h3>
            </div>
            
            {/* Document Expiry Dates */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Expiry Dates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Registration Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.registrationDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Fitness Expiry</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.fitnessExpiryDate)}</p>
                  </div>
                  {getExpiryBadge(vehicle.fitnessExpiryDate)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Insurance Expiry</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.insuranceExpiryDate)}</p>
                  </div>
                  {getExpiryBadge(vehicle.insuranceExpiryDate)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">PUC Expiry</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.pucExpiryDate)}</p>
                  </div>
                  {getExpiryBadge(vehicle.pucExpiryDate)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Permit Expiry</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.permitExpiryDate)}</p>
                  </div>
                  {getExpiryBadge(vehicle.permitExpiryDate)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">National Permit Expiry</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.nationalPermitExpiryDate)}</p>
                  </div>
                  {getExpiryBadge(vehicle.nationalPermitExpiryDate)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Tax Valid Upto</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.taxValidUptoDate)}</p>
                  </div>
                  {getExpiryBadge(vehicle.taxValidUptoDate)}
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Document Uploads</h4>
              <VehicleDocumentUpload 
                vehicle={vehicle} 
                onUpdate={() => {
                  // Reload vehicle data
                  window.location.reload();
                }}
                isAdminView={true}
              />
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <VehicleExpensesTab vehicle={vehicle} formatCurrency={formatCurrency} />
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Document Expiry Alerts</h3>
              <span className="text-xs text-gray-500">(30 days before expiry)</span>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium">All Documents Valid</p>
                <p className="text-gray-400 text-sm mt-2">No expiring or expired documents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'critical' 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <AlertTriangle 
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold ${
                            alert.severity === 'critical' ? 'text-red-900' : 'text-yellow-900'
                          }`}>
                            {alert.name}
                          </h4>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            alert.severity === 'critical' 
                              ? 'bg-red-200 text-red-900' 
                              : 'bg-yellow-200 text-yellow-900'
                          }`}>
                            {alert.severity === 'critical' ? 'EXPIRED' : 'EXPIRING SOON'}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          alert.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {alert.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <div className={alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Expiry Date: {formatDate(alert.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="flex justify-end mt-6 pt-6 border-t">
        <button
          onClick={onClose}
          className="btn btn-secondary"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
