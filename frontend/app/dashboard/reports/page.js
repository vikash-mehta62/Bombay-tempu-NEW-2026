'use client';

import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  FileText,
  Truck,
  BarChart3,
  Calculator,
  Download
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [profitBreakdown, setProfitBreakdown] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [podData, setPodData] = useState(null);
  const [clientPendingData, setClientPendingData] = useState(null);
  const [fleetPendingData, setFleetPendingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [podFilters, setPodFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (activeTab === 'pods') {
      loadPODReports();
    } else if (activeTab === 'client-pending') {
      loadClientPendingReport();
    } else if (activeTab === 'fleet-pending') {
      loadFleetPendingReport();
    }
  }, [activeTab, podFilters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [reportsRes, breakdownRes, maintenanceRes] = await Promise.all([
        reportsAPI.getReports(),
        reportsAPI.getProfitBreakdown(),
        reportsAPI.getMaintenanceCosts()
      ]);
      
      setReports(reportsRes.data.data);
      setProfitBreakdown(breakdownRes.data.data);
      setMaintenanceData(maintenanceRes.data.data);
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPODReports = async () => {
    try {
      const response = await reportsAPI.getPODReports(podFilters);
      setPodData(response.data.data);
    } catch (error) {
      toast.error('Failed to load POD reports');
      console.error(error);
    }
  };

  const loadClientPendingReport = async () => {
    try {
      const response = await reportsAPI.getClientPendingReport();
      setClientPendingData(response.data.data);
    } catch (error) {
      toast.error('Failed to load client pending report');
      console.error(error);
    }
  };

  const exportClientPendingToExcel = () => {
    if (!clientPendingData || clientPendingData.clients.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create CSV content
    let csvContent = 'Client Pending Payment Report\n\n';
    csvContent += 'SR NO,Vehicle Number,Client Name,Pending Ad Count,Pending Advance\n';
    
    clientPendingData.clients.forEach((client, index) => {
      client.trips.forEach((trip) => {
        csvContent += `${index + 1},"${trip.vehicleNumber}","${client.clientName}",${client.totalPendingCount},${client.totalPendingAmount}\n`;
      });
    });
    
    csvContent += `\nTOTAL,,,${clientPendingData.summary.totalTripsWithPending},${clientPendingData.summary.grandTotalPending}\n`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Client_Pending_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully');
  };

  const loadFleetPendingReport = async () => {
    try {
      const response = await reportsAPI.getFleetPendingReport();
      setFleetPendingData(response.data.data);
    } catch (error) {
      toast.error('Failed to load fleet pending report');
      console.error(error);
    }
  };

  const exportFleetPendingToExcel = () => {
    if (!fleetPendingData || fleetPendingData.fleetOwners.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create CSV content
    let csvContent = 'Fleet Owner Pending Payment Report\n\n';
    csvContent += 'SR NO,Vehicle Number,Fleet Owner Name,Pending Ad Count,Pending Balance\n';
    
    fleetPendingData.fleetOwners.forEach((fleet, index) => {
      fleet.trips.forEach((trip) => {
        csvContent += `${index + 1},"${trip.vehicleNumber}","${fleet.fleetOwnerName}",${fleet.totalPendingCount},${fleet.totalPendingAmount}\n`;
      });
    });
    
    csvContent += `\nTOTAL,,,${fleetPendingData.summary.totalTripsWithPending},${fleetPendingData.summary.grandTotalPending}\n`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Fleet_Pending_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully');
  };

  const getColorClass = (color) => {
    switch (color) {
      case 'red':
        return 'bg-red-500 text-white font-bold';
      case 'yellow':
        return 'bg-yellow-400 text-black font-semibold';
      case 'green':
        return 'bg-green-400 text-black';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pod_pending: { label: 'POD Pending', color: 'bg-orange-100 text-orange-700' },
      pod_received: { label: 'POD Received', color: 'bg-purple-100 text-purple-700' },
      pod_submitted: { label: 'POD Submitted', color: 'bg-yellow-100 text-yellow-700' },
      settled: { label: 'Settled', color: 'bg-green-100 text-green-700' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="w-7 h-7 mr-2" />
          Reports & Analytics
        </h1>
        <p className="text-gray-600">Comprehensive business reports and insights</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Maintenance
          </button>
          <button
            onClick={() => setActiveTab('pods')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pods'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            PODs
          </button>
          <button
            onClick={() => setActiveTab('client-pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'client-pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Client Pending
          </button>
          <button
            onClick={() => setActiveTab('fleet-pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fleet-pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Fleet Pending
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Profit Breakdown Card */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Calculator className="w-6 h-6 text-gray-700 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Profit Breakdown</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">Financial overview for current period</p>

            <div className="space-y-3">
              {/* Trip Profit */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-base font-medium text-green-700">Trip Profit</span>
                <span className="text-xl font-bold text-green-700">
                  {formatCurrency(reports.overview.tripProfit)}
                </span>
              </div>

              {/* Commission */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="text-base font-medium text-blue-700">Commission</span>
                <span className="text-xl font-bold text-blue-700">
                  {formatCurrency(reports.overview.commission)}
                </span>
              </div>

              {/* Trip Difference */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <span className="text-base font-medium text-purple-700">Trip Difference</span>
                  <p className="text-xs text-purple-600 mt-1">Total Freight - Hire Cost (Fleet only)</p>
                </div>
                <span className="text-xl font-bold text-purple-700">
                  {formatCurrency(reports.overview.tripDifference)}
                </span>
              </div>

              {/* Trip Expenses */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <span className="text-base font-medium text-red-700">Trip Expenses</span>
                  <p className="text-xs text-red-600 mt-1">Fleet Advances + Fleet Expenses + Driver Advances + Driver Expenses</p>
                </div>
                <span className="text-xl font-bold text-red-700">
                  -{formatCurrency(reports.overview.tripExpenses)}
                </span>
              </div>

              {/* Other Expenses */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <span className="text-base font-medium text-red-700">Other Expenses</span>
                  <p className="text-xs text-red-600 mt-1">General Expenses</p>
                </div>
                <span className="text-xl font-bold text-red-700">
                  -{formatCurrency(reports.overview.otherExpenses)}
                </span>
              </div>

              {/* Total Expenses */}
              <div className="flex items-center justify-between p-4 bg-red-100 rounded-lg border-2 border-red-200">
                <span className="text-base font-semibold text-red-800">Total Expenses</span>
                <span className="text-xl font-bold text-red-800">
                  -{formatCurrency(reports.overview.totalExpenses)}
                </span>
              </div>

              {/* Final Profit */}
              <div className="flex items-center justify-between p-5 bg-blue-100 rounded-lg border-2 border-blue-300 mt-4">
                <span className="text-lg font-bold text-blue-900">Final Profit</span>
                <span className={`text-2xl font-bold ${reports.overview.finalProfit >= 0 ? 'text-blue-900' : 'text-red-700'}`}>
                  {formatCurrency(reports.overview.finalProfit)}
                </span>
              </div>
            </div>

            {/* Formula Display */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Calculation Formula:</p>
              <p className="text-xs text-gray-600">
                Final Profit = Trip Profit - (Trip Expenses + Other Expenses)
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Trip Difference = Total Freight - Hire Cost (Fleet-owned vehicles only)
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Trip Expenses = Fleet Advances + Fleet Expenses + Driver Advances + Driver Expenses
              </p>
            </div>
          </div>

          {/* Profit Breakdown by Vehicle Type */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profit by Vehicle Type</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Vehicle Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Trips
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profitBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    profitBreakdown.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {item._id === 'self_owned' ? 'Self Owned' : 'Fleet Owner'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-900">{item.tripCount}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-blue-600">
                            {formatCurrency(item.totalRevenue)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${item.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(item.totalProfit)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && maintenanceData && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-gray-50">
              <p className="text-sm text-gray-600 mb-1">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{maintenanceData.summary.total}</p>
            </div>
            <div className="card bg-red-50">
              <p className="text-sm text-gray-600 mb-1">Expired/Expiring</p>
              <p className="text-2xl font-bold text-red-600">{maintenanceData.summary.expired}</p>
            </div>
            <div className="card bg-yellow-50">
              <p className="text-sm text-gray-600 mb-1">Warning (2 months)</p>
              <p className="text-2xl font-bold text-yellow-600">{maintenanceData.summary.warning}</p>
            </div>
            <div className="card bg-green-50">
              <p className="text-sm text-gray-600 mb-1">Valid</p>
              <p className="text-2xl font-bold text-green-600">{maintenanceData.summary.valid}</p>
            </div>
          </div>

          {/* Maintenance Table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-500">
                      Vehicle No
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-500">
                      Fitness
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-500">
                      Tax
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-500">
                      Insurance
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-500">
                      PUCC
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-500">
                      Permit
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">
                      National Permit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {maintenanceData.vehicles.map((vehicle, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-r border-gray-200">
                        <span className="text-sm font-semibold text-gray-900">
                          {vehicle.vehicleNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200">
                        <span className={`inline-block px-3 py-1 rounded text-sm ${getColorClass(vehicle.fitness.color)}`}>
                          {formatDate(vehicle.fitness.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200">
                        <span className={`inline-block px-3 py-1 rounded text-sm ${getColorClass(vehicle.tax.color)}`}>
                          {formatDate(vehicle.tax.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200">
                        <span className={`inline-block px-3 py-1 rounded text-sm ${getColorClass(vehicle.insurance.color)}`}>
                          {formatDate(vehicle.insurance.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200">
                        <span className={`inline-block px-3 py-1 rounded text-sm ${getColorClass(vehicle.pucc.color)}`}>
                          {formatDate(vehicle.pucc.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200">
                        <span className={`inline-block px-3 py-1 rounded text-sm ${getColorClass(vehicle.permit.color)}`}>
                          {formatDate(vehicle.permit.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded text-sm ${getColorClass(vehicle.nationalPermit.color)}`}>
                          {formatDate(vehicle.nationalPermit.date)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Color Legend:</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <span className="inline-block w-6 h-6 bg-red-500 rounded mr-2"></span>
                <span className="text-sm text-gray-700">Expired or Expiring within 1 month</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-6 h-6 bg-yellow-400 rounded mr-2"></span>
                <span className="text-sm text-gray-700">Expiring within 2 months</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-6 h-6 bg-green-400 rounded mr-2"></span>
                <span className="text-sm text-gray-700">Valid (more than 2 months)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PODs Tab */}
      {activeTab === 'pods' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="label">Search</label>
                <input
                  type="text"
                  placeholder="Trip/Client/Vehicle..."
                  value={podFilters.search}
                  onChange={(e) => setPodFilters({ ...podFilters, search: e.target.value })}
                  className="input"
                />
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="label">Status</label>
                <select
                  value={podFilters.status}
                  onChange={(e) => setPodFilters({ ...podFilters, status: e.target.value })}
                  className="input"
                >
                  <option value="">All Status</option>
                  <option value="pod_pending">POD Pending</option>
                  <option value="pod_received">POD Received</option>
                  <option value="pod_submitted">POD Submitted</option>
                  <option value="settled">Settled</option>
                </select>
              </div>
              
              {/* Start Date */}
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={podFilters.startDate}
                  onChange={(e) => setPodFilters({ ...podFilters, startDate: e.target.value })}
                  className="input"
                />
              </div>
              
              {/* End Date */}
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  value={podFilters.endDate}
                  onChange={(e) => setPodFilters({ ...podFilters, endDate: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            
            {/* Clear Filters */}
            {(podFilters.search || podFilters.status || podFilters.startDate || podFilters.endDate) && (
              <div className="mt-4">
                <button
                  onClick={() => setPodFilters({ status: '', search: '', startDate: '', endDate: '' })}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Status Tabs */}
          {podData && (
            <div className="card">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPodFilters({ ...podFilters, status: '' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    podFilters.status === '' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({podData.total})
                </button>
                <button
                  onClick={() => setPodFilters({ ...podFilters, status: 'pod_pending' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    podFilters.status === 'pod_pending' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  POD Pending ({podData.statusCounts.pod_pending})
                </button>
                <button
                  onClick={() => setPodFilters({ ...podFilters, status: 'pod_received' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    podFilters.status === 'pod_received' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  POD Received ({podData.statusCounts.pod_received})
                </button>
                <button
                  onClick={() => setPodFilters({ ...podFilters, status: 'pod_submitted' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    podFilters.status === 'pod_submitted' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  POD Submitted ({podData.statusCounts.pod_submitted})
                </button>
                <button
                  onClick={() => setPodFilters({ ...podFilters, status: 'settled' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    podFilters.status === 'settled' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Settled ({podData.statusCounts.settled})
                </button>
              </div>
            </div>
          )}

          {/* POD List */}
          {podData && (
            <div className="space-y-3">
              {podData.pods.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-500">No PODs found</p>
                </div>
              ) : (
                podData.pods.map((pod) => (
                  <div key={pod._id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {pod.clientName}
                          </h3>
                          {getStatusBadge(pod.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Trip:</span> {pod.tripNumber}
                          </div>
                          <div>
                            <span className="font-medium">Route:</span> {pod.origin} → {pod.destination}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {formatDate(pod.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Client Pending Payment Report Tab */}
      {activeTab === 'client-pending' && (
        <div className="space-y-4">
          {clientPendingData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-blue-50">
                  <p className="text-sm text-gray-600 mb-1">Total Clients with Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{clientPendingData.summary.totalClients}</p>
                </div>
                <div className="card bg-orange-50">
                  <p className="text-sm text-gray-600 mb-1">Total Trips with Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{clientPendingData.summary.totalTripsWithPending}</p>
                </div>
                <div className="card bg-red-50">
                  <p className="text-sm text-gray-600 mb-1">Grand Total Pending</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(clientPendingData.summary.grandTotalPending)}</p>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end">
                <button
                  onClick={exportClientPendingToExcel}
                  className="btn bg-green-600 text-white hover:bg-green-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </button>
              </div>

              {/* Client Pending Table */}
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-500">
                          SR NO
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-500">
                          Vehicle Number
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-500">
                          Client Name
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-500">
                          Pending Ad Count
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          Pending Advance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clientPendingData.clients.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                            No pending payments found
                          </td>
                        </tr>
                      ) : (
                        <>
                          {clientPendingData.clients.map((client, index) => (
                            <tr key={client.clientId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 border-r border-gray-200">
                                <span className="text-sm text-gray-900">{index + 1}</span>
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200">
                                <div className="text-sm text-gray-900">
                                  {client.trips.map((trip, idx) => (
                                    <div key={idx} className="py-1">
                                      {trip.vehicleNumber}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200">
                                <span className="text-sm font-medium text-gray-900">{client.clientName}</span>
                              </td>
                              <td className="px-4 py-3 text-center border-r border-gray-200">
                                <span className="text-sm font-semibold text-orange-600">{client.totalPendingCount}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-bold text-red-600">{formatCurrency(client.totalPendingAmount)}</span>
                              </td>
                            </tr>
                          ))}
                          {/* Total Row */}
                          <tr className="bg-gray-100 font-bold">
                            <td colSpan="3" className="px-4 py-3 text-right border-r border-gray-300">
                              <span className="text-sm text-gray-900">TOTAL</span>
                            </td>
                            <td className="px-4 py-3 text-center border-r border-gray-300">
                              <span className="text-sm text-orange-700">{clientPendingData.summary.totalTripsWithPending}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm text-red-700">{formatCurrency(clientPendingData.summary.grandTotalPending)}</span>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading client pending report...</p>
            </div>
          )}
        </div>
      )}

      {/* Fleet Owner Pending Payment Report Tab */}
      {activeTab === 'fleet-pending' && (
        <div className="space-y-4">
          {fleetPendingData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-blue-50">
                  <p className="text-sm text-gray-600 mb-1">Total Fleet Owners with Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{fleetPendingData.summary.totalFleetOwners}</p>
                </div>
                <div className="card bg-orange-50">
                  <p className="text-sm text-gray-600 mb-1">Total Trips with Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{fleetPendingData.summary.totalTripsWithPending}</p>
                </div>
                <div className="card bg-red-50">
                  <p className="text-sm text-gray-600 mb-1">Grand Total Pending</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(fleetPendingData.summary.grandTotalPending)}</p>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end">
                <button
                  onClick={exportFleetPendingToExcel}
                  className="btn bg-green-600 text-white hover:bg-green-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </button>
              </div>

              {/* Fleet Pending Table */}
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-500">
                          SR NO
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-500">
                          Vehicle Number
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-r border-blue-500">
                          Fleet Owner Name
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-500">
                          Pending Ad Count
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          Pending Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {fleetPendingData.fleetOwners.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                            No pending payments found
                          </td>
                        </tr>
                      ) : (
                        <>
                          {fleetPendingData.fleetOwners.map((fleet, index) => (
                            <tr key={fleet.fleetOwnerId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 border-r border-gray-200">
                                <span className="text-sm text-gray-900">{index + 1}</span>
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200">
                                <div className="text-sm text-gray-900">
                                  {fleet.trips.map((trip, idx) => (
                                    <div key={idx} className="py-1">
                                      {trip.vehicleNumber}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200">
                                <span className="text-sm font-medium text-gray-900">{fleet.fleetOwnerName}</span>
                              </td>
                              <td className="px-4 py-3 text-center border-r border-gray-200">
                                <span className="text-sm font-semibold text-orange-600">{fleet.totalPendingCount}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-bold text-red-600">{formatCurrency(fleet.totalPendingAmount)}</span>
                              </td>
                            </tr>
                          ))}
                          {/* Total Row */}
                          <tr className="bg-gray-100 font-bold">
                            <td colSpan="3" className="px-4 py-3 text-right border-r border-gray-300">
                              <span className="text-sm text-gray-900">TOTAL</span>
                            </td>
                            <td className="px-4 py-3 text-center border-r border-gray-300">
                              <span className="text-sm text-orange-700">{fleetPendingData.summary.totalTripsWithPending}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm text-red-700">{formatCurrency(fleetPendingData.summary.grandTotalPending)}</span>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading fleet pending report...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
