'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardAPI, logsAPI } from '@/lib/api';
import {
  Truck,
  Users,
  MapPin,
  DollarSign,
  TrendingUp,
  Activity,
  UserCircle,
  Receipt,
} from 'lucide-react';
import { formatCurrency, formatDateTime, getActionTypeColor } from '@/lib/utils';
import TruckLoader from '@/components/TruckLoader';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboardRes, logsRes] = await Promise.all([
        dashboardAPI.getStats(),
        logsAPI.getRecent(10),
      ]);

      setStats(dashboardRes.data.data);
      setRecentLogs(logsRes.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <TruckLoader size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats?.overview?.totalVehicles || 0,
      icon: Truck,
      color: 'bg-blue-500',
      link: '/dashboard/vehicles',
    },
    {
      title: 'In Progress Trips',
      value: stats?.overview?.inProgressTrips || 0,
      icon: MapPin,
      color: 'bg-green-500',
      link: '/dashboard/trips',
    },
    {
      title: 'Total Drivers',
      value: stats?.overview?.totalDrivers || 0,
      icon: UserCircle,
      color: 'bg-purple-500',
      link: '/dashboard/drivers',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.overview?.monthlyRevenue || 0),
      icon: DollarSign,
      color: 'bg-yellow-500',
      link: '/dashboard/reports',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your fleet overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(stat.link)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <Receipt className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats?.overview?.totalRevenue || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            From {stats?.overview?.totalTrips || 0} trips
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <Receipt className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats?.overview?.totalExpenses || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Trip: {formatCurrency(stats?.overview?.totalTripExpenses || 0)} | 
            Client: {formatCurrency(stats?.overview?.totalClientExpenses || 0)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Profit</p>
            <TrendingUp className={`w-5 h-5 ${
              (stats?.overview?.totalProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
            }`} />
          </div>
          <p className={`text-2xl font-bold ${
            (stats?.overview?.totalProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
          }`}>
            {formatCurrency(stats?.overview?.totalProfit || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Monthly: {formatCurrency(stats?.overview?.monthlyProfit || 0)}
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Status Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Vehicle Status
          </h2>
          <div className="space-y-3">
            {stats?.vehiclesByStatus && stats.vehiclesByStatus.length > 0 ? (
              stats.vehiclesByStatus.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item._id === 'available' ? 'bg-green-500' :
                      item._id === 'in_use' ? 'bg-blue-500' :
                      item._id === 'maintenance' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-700 capitalize">
                      {item._id.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No vehicles</p>
            )}
          </div>
        </div>

        {/* Trip Status Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Trip Status
          </h2>
          <div className="space-y-3">
            {stats?.tripsByStatus && stats.tripsByStatus.length > 0 ? (
              stats.tripsByStatus.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item._id === 'completed' ? 'bg-green-500' :
                      item._id === 'in_progress' ? 'bg-yellow-500' :
                      item._id === 'scheduled' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-700 capitalize">
                      {item._id.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 block">
                      {item.count} trips
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(item.revenue || 0)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No trips</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => router.push('/dashboard/vehicles')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Truck className="w-6 h-6 text-gray-600 mb-2 mx-auto" />
            <p className="text-sm font-medium text-gray-900">Add Vehicle</p>
          </button>
          <button 
            onClick={() => router.push('/dashboard/trips')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <MapPin className="w-6 h-6 text-gray-600 mb-2 mx-auto" />
            <p className="text-sm font-medium text-gray-900">Create Trip</p>
          </button>
          <button 
            onClick={() => router.push('/dashboard/drivers')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <UserCircle className="w-6 h-6 text-gray-600 mb-2 mx-auto" />
            <p className="text-sm font-medium text-gray-900">Add Driver</p>
          </button>
          <button 
            onClick={() => router.push('/dashboard/expenses')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <DollarSign className="w-6 h-6 text-gray-600 mb-2 mx-auto" />
            <p className="text-sm font-medium text-gray-900">Add Expense</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </h2>
          <button
            onClick={() => router.push('/dashboard/logs')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No recent activity
            </p>
          ) : (
            recentLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500">
                    by {log.userName} • {formatDateTime(log.timestamp)}
                  </p>
                </div>
                <span
                  className={`badge ${getActionTypeColor(log.actionType)}`}
                >
                  {log.actionType}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
