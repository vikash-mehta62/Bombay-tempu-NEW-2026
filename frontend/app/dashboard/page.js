'use client';

import { useEffect, useState } from 'react';
import { vehicleAPI, logsAPI } from '@/lib/api';
import {
  Truck,
  Users,
  MapPin,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { formatCurrency, formatDateTime, getActionTypeColor } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [vehicleStatsRes, logsRes] = await Promise.all([
        vehicleAPI.getStats(),
        logsAPI.getRecent(10),
      ]);

      setStats(vehicleStatsRes.data.data);
      setRecentLogs(logsRes.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats?.total || 0,
      icon: Truck,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Active Trips',
      value: '0',
      icon: MapPin,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'Total Drivers',
      value: '0',
      icon: Users,
      color: 'bg-purple-500',
      change: '+5%',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(0),
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%',
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
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vehicle Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Status Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Vehicle Status
          </h2>
          <div className="space-y-3">
            {stats?.byStatus?.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 capitalize">
                    {item._id.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Truck className="w-6 h-6 text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Vehicle</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <MapPin className="w-6 h-6 text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Create Trip</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Users className="w-6 h-6 text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Driver</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <DollarSign className="w-6 h-6 text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Expense</p>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </h2>
          <a
            href="/dashboard/logs"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All
          </a>
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
