'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Loader,
  CheckCircle,
  AlertCircle,
  Clock,
  X
} from 'lucide-react';
import { tripAPI, clientPaymentAPI, clientAPI, adjustmentPaymentAPI } from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { generateClientReceipt, generateClientBalanceStatement, generateClientAdjustmentStatement } from '@/utils/receiptGenerator';

// Client Payment Statement Tab Component
function ClientPaymentStatementTab({ client, formatCurrency }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [payments, setPayments] = useState({});
  const [expenses, setExpenses] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  
  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalBaseAmount: 0,
    totalPayments: 0,
    totalExpenses: 0,
    seventyPercentRequired: 0,
    pendingAmount: 0,
    toReach70: 0
  });
  
  const [statementTab, setStatementTab] = useState('all');

  useEffect(() => {
    if (client?._id) {
      loadClientData();
    }
  }, [client]);

  useEffect(() => {
    applyFilters();
  }, [transactions, fromDate, toDate, statusFilter, amountFilter]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch complete client statement from backend
      const response = await clientAPI.getStatement(client._id);
      const data = response.data.data;
      
      // Set all data from backend
      setTrips(data.trips || []);
      setTransactions(data.statement.entries || []);
      setFilteredTransactions(data.statement.entries || []);
      setStats({
        totalTrips: data.stats.totalTrips || 0,
        totalBaseAmount: data.stats.totalAmount || 0,
        totalPayments: data.stats.totalPaid || 0,
        totalExpenses: data.stats.totalExpenses || 0,
        seventyPercentRequired: data.stats.seventyPercentRequired || 0,
        pendingAmount: data.stats.overallBalance || 0,
        toReach70: data.stats.pendingToReach70 || 0,
        closingBalance: data.statement.closingBalance || 0
      });
      
      // Set payments data for trip details
      const paymentsData = {};
      data.trips.forEach(trip => {
        paymentsData[trip.tripId] = [{
          amount: trip.paid
        }];
      });
      setPayments(paymentsData);
      
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Date filters
    if (fromDate) {
      filtered = filtered.filter(txn => new Date(txn.date) >= new Date(fromDate));
    }
    if (toDate) {
      filtered = filtered.filter(txn => new Date(txn.date) <= new Date(toDate));
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(txn => txn.status === statusFilter);
    }
    
    // Amount filter
    if (amountFilter) {
      const amount = parseFloat(amountFilter);
      filtered = filtered.filter(txn => 
        (txn.debit >= amount) || (txn.credit >= amount)
      );
    }
    
    // Recalculate totals for filtered data
    const filteredDebit = filtered.reduce((sum, txn) => sum + txn.debit, 0);
    const filteredCredit = filtered.reduce((sum, txn) => sum + txn.credit, 0);
    
    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('');
    setAmountFilter('');
  };

  const getTripPaymentStatus = (trip) => {
    // trip is already processed from backend with payment status
    if (trip.paymentStatus) {
      return { 
        status: trip.paymentStatus, 
        percentage: trip.percentagePaid || 0 
      };
    }
    
    // Fallback
    return { status: 'pending', percentage: 0 };
  };

  const getFilteredTrips = () => {
    if (statementTab === 'paid') {
      return trips.filter(t => t.percentagePaid >= 70);
    } else if (statementTab === 'pending') {
      return trips.filter(t => t.percentagePaid < 70);
    }
    return trips;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pod_pending': { color: 'bg-orange-100 text-orange-800', label: 'Pending' },
      'pod_received': { color: 'bg-purple-100 text-purple-800', label: 'POD Received' },
      'pod_submitted': { color: 'bg-yellow-100 text-yellow-800', label: 'POD Submitted' },
      'settled': { color: 'bg-green-100 text-green-800', label: 'Settled' },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };
    return badges[status] || { color: 'bg-gray-100 text-gray-800', label: status };
  };

  const downloadTripReceipt = async (trip, client) => {
    try {
      // Fetch trip details to get full information
      const tripResponse = await tripAPI.getById(trip.tripId);
      const tripData = tripResponse.data.data;
      
      // Fetch client payments for this trip and client
      let clientPayments = [];
      try {
        const paymentsResponse = await clientPaymentAPI.getByTripAndClient(trip.tripId, client._id);
        clientPayments = paymentsResponse.data.data || [];
      } catch (error) {
        console.log('No payments found for this trip');
      }
      
      // Prepare trip data for receipt
      const receiptTripData = {
        ...trip,
        tripNumber: trip.tripNumber,
        loadDate: trip.loadDate,
        vehicleNumber: tripData.vehicleId?.vehicleNumber,
        vehicleId: tripData.vehicleId,
        originCity: tripData.clients[0]?.originCity,
        destinationCity: tripData.clients[0]?.destinationCity,
        packagingType: tripData.clients[0]?.packagingType
      };
      
      // Generate receipt using reusable function
      await generateClientReceipt(receiptTripData, client, clientPayments, formatCurrency);
      
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Trip Number', 'Date & Time', 'Reason', 'Type', 'Debit', 'Credit', 'Details', 'Status'];
      const rows = [];
      
      filteredTransactions.forEach(txn => {
        rows.push([
          txn.tripNumber,
          new Date(txn.date).toLocaleString('en-IN'),
          txn.reason,
          txn.type,
          txn.debit,
          txn.credit,
          txn.details,
          txn.status
        ]);
      });
      
      // Calculate totals
      const totalDebit = filteredTransactions.reduce((sum, txn) => sum + txn.debit, 0);
      const totalCredit = filteredTransactions.reduce((sum, txn) => sum + txn.credit, 0);
      
      // Create CSV
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });
      
      // Add summary
      csvContent += '\n';
      csvContent += `"TOTAL","","","","${totalDebit}","${totalCredit}","",""\n`;
      csvContent += `"Balance","","","","","${totalDebit - totalCredit}","",""\n`;
      csvContent += '\n';
      csvContent += `"Total Trips","${stats.totalTrips}"\n`;
      csvContent += `"Total Amount","${stats.totalAmount}"\n`;
      csvContent += `"Total Advance (70%)","${stats.totalAdvance}"\n`;
      csvContent += `"70% Required","${stats.seventyPercentRequired}"\n`;
      csvContent += `"Pending to Reach 70%","${stats.pendingToReach70}"\n`;
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${client.fullName}_statement_${new Date().toISOString().split('T')[0]}.csv`;
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
      doc.text('Payment Statement', 14, 20);
      doc.setFontSize(12);
      doc.text(`Client: ${client.fullName}`, 14, 28);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 35);
      
      // Summary
      doc.setFontSize(14);
      doc.text('Summary', 14, 45);
      doc.autoTable({
        startY: 50,
        head: [['Metric', 'Amount']],
        body: [
          ['Total Trips', stats.totalTrips.toString()],
          ['Total Amount', formatCurrency(stats.totalAmount)],
          ['Total Advance (70%)', formatCurrency(stats.totalAdvance)],
          ['70% Required', formatCurrency(stats.seventyPercentRequired)],
          ['Pending to Reach 70%', formatCurrency(stats.pendingToReach70)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      // Trip Details
      const tripRows = trips.map(trip => {
        const clientData = trip.clients.find(c => c.clientId?._id === client._id);
        if (!clientData) return null;
        
        const tripPayments = payments[trip._id] || [];
        const totalPaid = tripPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalAmount = clientData.clientRate;
        const pending = totalAmount - totalPaid;
        const seventyPercent = totalAmount * 0.7;
        const toReach70 = Math.max(0, seventyPercent - totalPaid);
        const status = getTripPaymentStatus(trip);
        
        return [
          trip.tripNumber,
          new Date(trip.loadDate).toLocaleDateString('en-IN'),
          formatCurrency(totalAmount),
          formatCurrency(totalPaid),
          formatCurrency(pending),
          formatCurrency(seventyPercent),
          formatCurrency(toReach70),
          status.percentage >= 70 ? '70% Paid' : 'Pending'
        ];
      }).filter(Boolean);
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Trip', 'Date', 'Total', 'Paid', 'Pending', '70% Req', 'To Reach', 'Status']],
        body: tripRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });
      
      doc.save(`${client.fullName}_statement_${new Date().toISOString().split('T')[0]}.pdf`);
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
        <span className="ml-3 text-gray-600">Loading payment data...</span>
      </div>
    );
  }

  const filteredTrips = getFilteredTrips();
  const paidTrips = trips.filter(t => t.percentage >= 70);
  const pendingTrips = trips.filter(t => t.percentage < 70);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700 font-medium">Total Base Amount</p>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalBaseAmount)}</p>
          <p className="text-xs text-blue-600 mt-1">Rate - Adjustment</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700 font-medium">Total Payments</p>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalPayments)}</p>
          <p className="text-xs text-green-600 mt-1">Received from client</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-orange-700 font-medium">Total Expenses</p>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(stats.totalExpenses)}</p>
          <p className="text-xs text-orange-600 mt-1">Client expenses</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-red-700 font-medium">Pending Amount</p>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.pendingAmount)}</p>
          <p className="text-xs text-red-600 mt-1">Base - Payments + Expenses</p>
        </div>
      </div>

      {/* 70% Calculation Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">70% Payment Calculation</h4>
            <p className="text-sm text-purple-700">
              Formula: 70% Required = Base Amount × 0.7 = {formatCurrency(stats.totalBaseAmount)} × 0.7 = {formatCurrency(stats.seventyPercentRequired)}
            </p>
            <p className="text-sm text-purple-700 mt-1">
              To Reach 70%: {formatCurrency(stats.seventyPercentRequired)} - {formatCurrency(stats.totalPayments)} = {formatCurrency(stats.toReach70)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-purple-600">70% Required</p>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.seventyPercentRequired)}</p>
            <p className="text-xs text-purple-600 mt-2">Still Needed</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(stats.toReach70)}</p>
          </div>
        </div>
      </div>

      {/* Transaction Statement Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900">Transaction Statement</h4>
            <p className="text-sm text-gray-600">Complete transaction history • {filteredTransactions.length} entries • Generated on {new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                await generateClientBalanceStatement(client, trips, filteredTransactions, formatCurrency);
              }}
              className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Client Balance</span>
            </button>
            <button
              onClick={exportToCSV}
              className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center space-x-2 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Trip Number</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Date & Time</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Reason</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Type</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Debit</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Credit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-1/4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{txn.tripNumber}</td>
                    <td className="px-3 py-2 text-gray-600">
                      <div className="text-xs">
                        {new Date(txn.date).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(txn.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{txn.reason}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        txn.type === 'advance' ? 'bg-green-100 text-green-700' :
                        txn.type === 'expense' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {txn.debit > 0 ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(txn.debit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {txn.credit > 0 ? (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(txn.credit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-xs">
                      <div className="max-w-xs">
                        {txn.details}
                        {txn.description && (
                          <div className="text-gray-500 mt-1 italic">
                            {txn.description}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr className="font-bold">
                <td colSpan="4" className="px-3 py-3 text-right text-gray-900">TOTAL</td>
                <td className="px-3 py-3 text-right text-red-600">
                  {formatCurrency(filteredTransactions.reduce((sum, txn) => sum + (txn.debit || 0), 0))}
                </td>
                <td className="px-3 py-3 text-right text-green-600">
                  {formatCurrency(filteredTransactions.reduce((sum, txn) => sum + (txn.credit || 0), 0))}
                </td>
                <td className="px-3 py-3"></td>
              </tr>
              <tr className="font-bold bg-blue-50">
                <td colSpan="6" className="px-3 py-3 text-right text-gray-900">Closing Balance (Credit - Debit): </td>
                <td className="px-3 py-3 text-left">
                  <span className={`text-lg ${
                    stats.closingBalance > 0 ? 'text-green-600' : stats.closingBalance < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(Math.abs(stats.closingBalance))}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Trip Statement with Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Trip Details</h4>
        </div>
        
        {/* Statement Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setStatementTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statementTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Trips ({trips.length})
            </button>
            <button
              onClick={() => setStatementTab('paid')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statementTab === 'paid'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              70% Amount Paid ({paidTrips.length})
            </button>
            <button
              onClick={() => setStatementTab('pending')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statementTab === 'pending'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              70% Pending ({pendingTrips.length})
            </button>
          </div>
        </div>
        
        {/* Trip List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No trips found</p>
            </div>
          ) : (
            filteredTrips.map(trip => {
              // Data is already processed from backend
              const status = getTripPaymentStatus(trip);
              
              return (
                <div key={trip.tripId} className={`p-4 rounded-lg border-2 ${
                  trip.percentagePaid >= 70 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        trip.percentagePaid >= 70 ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {trip.percentagePaid >= 70 ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Clock className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900">{trip.tripNumber}</h5>
                        <p className="text-xs text-gray-600">
                          {new Date(trip.loadDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      trip.percentagePaid >= 70 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {trip.percentagePaid.toFixed(1)}% Paid
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-600">Total Amount</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(trip.total)}</p>
                      {trip.adjustment !== 0 && (
                        <p className="text-xs text-gray-500">Rate - Adj</p>
                      )}
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-600">Paid</p>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(trip.paid)}</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-600">Expenses</p>
                      <p className="text-sm font-bold text-orange-600">{formatCurrency(trip.expenses)}</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-600">Balance</p>
                      <p className="text-sm font-bold text-red-600">{formatCurrency(trip.balance)}</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-600">70% Required</p>
                      <p className="text-sm font-bold text-purple-600">{formatCurrency(trip.seventyPercentOfTotal)}</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-600">To Reach 70%</p>
                      <p className="text-sm font-bold text-orange-600">{formatCurrency(trip.remainingToReach70Percent)}</p>
                    </div>
                  </div>
                  
                  {/* Formula Display */}
                  {trip.adjustment !== 0 && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                      <p className="text-xs text-yellow-800">
                        <span className="font-semibold">Total:</span> ₹{trip.clientRate} (Rate) {trip.adjustment >= 0 ? '-' : '-'} ₹{Math.abs(trip.adjustment)} (Adj) = ₹{trip.total}
                      </p>
                      <p className="text-xs text-yellow-800 mt-1">
                        <span className="font-semibold">Balance:</span> ₹{trip.total} (Total) - ₹{trip.paid} (Paid) + ₹{trip.expenses} (Exp) = ₹{trip.balance}
                      </p>
                    </div>
                  )}
                  
                  {/* Download Receipt Button */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => downloadTripReceipt(trip, client)}
                      className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Adjustment Tab Component
function ClientAdjustmentTab({ client, formatCurrency }) {
  const [loading, setLoading] = useState(true);
  const [adjustmentTrips, setAdjustmentTrips] = useState([]);
  const [adjustmentPayments, setAdjustmentPayments] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  
  const [stats, setStats] = useState({
    totalAdjustment: 0,
    totalPaid: 0,
    totalPending: 0,
    tripsCount: 0
  });

  useEffect(() => {
    if (client?._id) {
      loadAdjustmentData();
    }
  }, [client]);

  const loadAdjustmentData = async () => {
    try {
      setLoading(true);
      
      // Fetch all trips
      const tripsResponse = await tripAPI.getAll();
      const allTrips = tripsResponse.data.data;
      
      // Filter trips for this client with adjustment > 0
      const clientAdjustmentTrips = allTrips.filter(trip => {
        const clientData = trip.clients?.find(c => c.clientId?._id === client._id);
        return clientData && clientData.adjustment && clientData.adjustment !== 0 && trip.isActive;
      });
      
      // Fetch adjustment payments for each trip
      const paymentsData = {};
      let totalAdjustment = 0;
      let totalPaid = 0;
      
      for (const trip of clientAdjustmentTrips) {
        const clientData = trip.clients.find(c => c.clientId?._id === client._id);
        totalAdjustment += Math.abs(clientData.adjustment || 0);
        
        try {
          const paymentResponse = await adjustmentPaymentAPI.getByTripAndClient(trip._id, client._id);
          const tripPayments = paymentResponse.data.data || [];
          paymentsData[trip._id] = tripPayments;
          totalPaid += paymentResponse.data.totalPaid || 0;
        } catch (error) {
          paymentsData[trip._id] = [];
        }
      }
      
      setAdjustmentTrips(clientAdjustmentTrips);
      setAdjustmentPayments(paymentsData);
      setStats({
        totalAdjustment,
        totalPaid,
        totalPending: totalAdjustment - totalPaid,
        tripsCount: clientAdjustmentTrips.length
      });
    } catch (error) {
      console.error('Error loading adjustment data:', error);
      toast.error('Failed to load adjustment data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (trip) => {
    const clientData = trip.clients.find(c => c.clientId?._id === client._id);
    const tripPayments = adjustmentPayments[trip._id] || [];
    const totalPaid = tripPayments.reduce((sum, p) => sum + p.amount, 0);
    const pending = Math.abs(clientData.adjustment) - totalPaid;
    
    setSelectedTrip({ ...trip, clientData, pending });
    setPaymentForm({
      amount: pending.toString(),
      paymentMode: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedTrip) return;
    
    try {
      await adjustmentPaymentAPI.create({
        tripId: selectedTrip._id,
        clientId: client._id,
        amount: parseFloat(paymentForm.amount),
        paymentMode: paymentForm.paymentMode,
        paymentDate: paymentForm.paymentDate,
        remarks: paymentForm.remarks
      });
      
      toast.success('Adjustment payment added successfully');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        paymentMode: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      loadAdjustmentData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add payment');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await adjustmentPaymentAPI.delete(paymentId);
      toast.success('Payment deleted');
      loadAdjustmentData();
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading adjustment data...</span>
      </div>
    );
  }

  if (adjustmentTrips.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Adjustments Found</h3>
        <p className="text-sm text-gray-600">
          This client has no trips with adjustments.
        </p>
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
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.tripsCount}</p>
          <p className="text-xs text-blue-600 mt-1">With adjustments</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-orange-700 font-medium">Total Adjustment</p>
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(stats.totalAdjustment)}</p>
          <p className="text-xs text-orange-600 mt-1">Across all trips</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700 font-medium">Total Paid</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalPaid)}</p>
          <p className="text-xs text-green-600 mt-1">Adjustment payments</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-red-700 font-medium">Pending</p>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.totalPending)}</p>
          <p className="text-xs text-red-600 mt-1">Yet to be paid</p>
        </div>
      </div>

      {/* Download Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={async () => {
            // Prepare adjustment trips data with vehicle info
            const adjustmentTripsData = adjustmentTrips.map(trip => {
              const clientData = trip.clients.find(c => c.clientId?._id === client._id);
              return {
                tripNumber: trip.tripNumber,
                loadDate: trip.loadDate,
                vehicleNumber: trip.vehicleId?.vehicleNumber,
                vehicleId: trip.vehicleId,
                adjustment: Math.abs(clientData.adjustment || 0)
              };
            });
            
            await generateClientAdjustmentStatement(
              client,
              adjustmentTripsData,
              {
                totalTrips: stats.tripsCount,
                totalAdjustment: stats.totalAdjustment,
                totalPaid: stats.totalPaid,
                totalPending: stats.totalPending
              },
              formatCurrency
            );
          }}
          className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Adjustment Statement</span>
        </button>
      </div>

      {/* Trips with Adjustments */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Trips with Adjustments</h4>
        <div className="space-y-3">
          {adjustmentTrips.map(trip => {
            const clientData = trip.clients.find(c => c.clientId?._id === client._id);
            const tripPayments = adjustmentPayments[trip._id] || [];
            const totalPaid = tripPayments.reduce((sum, p) => sum + p.amount, 0);
            const adjustmentAmount = Math.abs(clientData.adjustment || 0);
            const pending = adjustmentAmount - totalPaid;
            const percentage = adjustmentAmount > 0 ? (totalPaid / adjustmentAmount) * 100 : 0;
            
            return (
              <div key={trip._id} className={`p-4 rounded-lg border-2 ${
                pending === 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-bold text-gray-900">{trip.tripNumber}</h5>
                    <p className="text-xs text-gray-600">
                      {new Date(trip.loadDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      pending === 0 ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                    }`}>
                      {percentage.toFixed(0)}% Paid
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-gray-600">Adjustment</p>
                    <p className="text-sm font-bold text-orange-600">{formatCurrency(adjustmentAmount)}</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-gray-600">Paid</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-gray-600">Pending</p>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(pending)}</p>
                  </div>
                </div>
                
                {/* Payment History */}
                {tripPayments.length > 0 && (
                  <div className="mb-3 bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Payment History</p>
                    <div className="space-y-2">
                      {tripPayments.map(payment => (
                        <div key={payment._id} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
                              <span className="text-gray-500">
                                {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {payment.paymentMode}
                              </span>
                            </div>
                            {payment.createdBy && (
                              <div className="text-gray-500 mt-1">
                                Added by: {payment.createdBy.fullName || payment.createdBy.email}
                              </div>
                            )}
                            {payment.remarks && (
                              <div className="text-gray-500 mt-1 italic">
                                {payment.remarks}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeletePayment(payment._id)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {pending > 0 && (
                  <button
                    onClick={() => handleOpenPaymentModal(trip)}
                    className="w-full btn bg-orange-600 text-white hover:bg-orange-700 text-sm"
                  >
                    Pay Adjustment
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Pay Adjustment - {selectedTrip.tripNumber}</h3>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (Pending: {formatCurrency(selectedTrip.pending)})
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  max={selectedTrip.pending}
                  required
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={paymentForm.paymentMode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  className="input"
                >
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  required
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  rows="2"
                  className="input"
                  placeholder="Optional notes..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button type="submit" className="btn bg-orange-600 text-white hover:bg-orange-700 flex-1">
                  Submit Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientViewModal({ isOpen, onClose, client }) {
  const [activeTab, setActiveTab] = useState('details');
  
  if (!client) return null;

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Client Details - ${client.fullName}`}
      size="xl"
    >
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Client Information
          </button>
          <button
            onClick={() => setActiveTab('statement')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'statement'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment Statement
          </button>
          <button
            onClick={() => setActiveTab('adjustment')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'adjustment'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Adjustment
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Client Details Tab */}
        {activeTab === 'details' && (
          <>
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-semibold text-gray-900">{client.fullName}</p>
                </div>
                {client.companyName && (
                  <div>
                    <p className="text-xs text-gray-500">Company Name</p>
                    <p className="text-sm font-medium text-gray-900">{client.companyName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="text-sm font-medium text-gray-900">{client.contact}</p>
                </div>
                {client.email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{client.email}</p>
                  </div>
                )}
                {client.address && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900">{client.address}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Payment Statement Tab */}
        {activeTab === 'statement' && (
          <ClientPaymentStatementTab client={client} formatCurrency={formatCurrency} />
        )}

        {/* Adjustment Tab */}
        {activeTab === 'adjustment' && (
          <ClientAdjustmentTab client={client} formatCurrency={formatCurrency} />
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
