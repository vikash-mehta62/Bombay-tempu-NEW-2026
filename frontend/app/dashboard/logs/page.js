'use client';

import { useEffect, useState } from 'react';
import { logsAPI } from '@/lib/api';
import {
  Activity,
  Download,
  Filter,
  Calendar,
  User,
  Search,
} from 'lucide-react';
import { formatDateTime, formatDate, formatCurrency, getActionTypeColor, downloadFile } from '@/lib/utils';
import { toast } from 'sonner';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    pages: 1
  });
  const [filters, setFilters] = useState({
    module: '',
    actionType: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logsAPI.getAll({
        ...filters,
        actionType: filters.actionType || undefined
      });
      setLogs(response.data.data);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        pages: response.data.pages
      });
    } catch (error) {
      toast.error('Failed to load activity logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await logsAPI.getStats({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Exporting logs...');
      const response = await logsAPI.export(filters);
      downloadFile(response.data, `activity-logs-${Date.now()}.xlsx`);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
      console.error(error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  // Helper function to extract financial amounts from log details
  const getFinancialAmounts = (log) => {
    const amounts = {
      withdrawal: 0,
      credit: 0,
      deleted: 0
    };

    // Extract amount from details
    const amount = log.details?.amount || 0;

    if (log.actionType === 'DELETE') {
      amounts.deleted = amount;
    } else if (log.actionType === 'CREATE' || log.actionType === 'UPDATE') {
      // Determine if it's withdrawal (expense/advance) or credit (payment)
      const module = log.module.toLowerCase();
      const action = log.action.toLowerCase();
      
      if (module === 'expenses' || action.includes('expense') || action.includes('advance')) {
        amounts.withdrawal = amount;
      } else if (module === 'payments' || action.includes('payment') || action.includes('received')) {
        amounts.credit = amount;
      }
    }

    return amounts;
  };

  // Extract trip number from log details
  const getTripNumber = (log) => {
    return log.details?.tripNumber || log.details?.tripId || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="w-7 h-7 mr-2" />
            Activity Logs
          </h1>
          <p className="text-gray-600">Track all user activities and changes</p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Export to Excel</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Total Activities</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Create Actions</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.byActionType?.find((s) => s._id === 'CREATE')?.count || 0}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Update Actions</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.byActionType?.find((s) => s._id === 'UPDATE')?.count || 0}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Delete Actions</p>
            <p className="text-2xl font-bold text-red-600">
              {stats.byActionType?.find((s) => s._id === 'DELETE')?.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Module Filter */}
          <div>
            <label className="label">Module</label>
            <select
              value={filters.module}
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="input"
            >
              <option value="">All Modules</option>
              <option value="authentication">Authentication</option>
              <option value="vehicles">Vehicles</option>
              <option value="drivers">Drivers</option>
              <option value="clients">Clients</option>
              <option value="trips">Trips</option>
              <option value="expenses">Expenses</option>
              <option value="invoices">Invoices</option>
              <option value="payments">Payments</option>
            </select>
          </div>

          {/* Action Type Filter */}
          <div>
            <label className="label">Action Type</label>
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
              className="input"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="AUTH">Authentication</option>
              <option value="EXPORT">Export</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.module || filters.actionType || filters.startDate || filters.endDate) && (
          <div className="mt-4">
            <button
              onClick={() =>
                setFilters({
                  module: '',
                  actionType: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 50,
                })
              }
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Activity Logs Ledger Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Trip No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Narration
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Action
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Withdrawal Amt
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Credit Amt
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Deleted Amt
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User Name
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const amounts = getFinancialAmounts(log);
                  const tripNumber = getTripNumber(log);
                  
                  return (
                    <tr key={log._id} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                        <div className="text-sm text-gray-900">
                          {formatDate(log.timestamp, 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(log.timestamp, 'hh:mm a')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                        <div className="text-sm font-medium text-gray-900">
                          {tripNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <div className="text-sm text-gray-900">
                          {log.action}
                        </div>
                        <div className="text-xs text-gray-500 capitalize mt-0.5">
                          {log.module}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center border-r border-gray-200">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionTypeColor(log.actionType)}`}
                        >
                          {log.actionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right border-r border-gray-200">
                        {amounts.withdrawal > 0 ? (
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(amounts.withdrawal)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right border-r border-gray-200">
                        {amounts.credit > 0 ? (
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(amounts.credit)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right border-r border-gray-200">
                        {amounts.deleted > 0 ? (
                          <span className="text-sm font-medium text-orange-600">
                            {formatCurrency(amounts.deleted)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.userName}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {log.userRole}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary and Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activity logs
        </p>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
            disabled={pagination.page === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-3 py-1">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={pagination.page >= pagination.pages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          
          <select
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
            className="px-3 py-1 border border-gray-300 rounded"
          >
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
            <option value="200">200 per page</option>
          </select>
        </div>
      </div>
    </div>
  );
}
