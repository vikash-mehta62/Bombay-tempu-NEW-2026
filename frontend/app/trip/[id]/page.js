'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { tripAPI } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Truck, MapPin, Calendar, User, Building2, Package } from 'lucide-react';

export default function PublicTripPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && params.id) {
      loadTrip();
    }
  }, [authLoading, user, params.id]);

  const loadTrip = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getById(params.id);
      setTrip(response.data.data);
    } catch (error) {
      console.error('Error loading trip:', error);
      toast.error('Failed to load trip details');
      router.push('/user-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  // Filter client data based on logged-in user
  const getClientData = () => {
    if (!trip || !user) return null;
    
    if (user.role === 'client') {
      // Show only logged-in client's data
      return trip.clients?.find(c => c.clientId?._id === user._id);
    }
    
    // For driver and fleet owner, show all clients
    return trip.clients;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Trip not found</p>
          <button
            onClick={() => router.push('/user-dashboard')}
            className="btn btn-primary mt-4"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const clientData = getClientData();
  const isClientView = user.role === 'client';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/user-dashboard')}
                className="btn btn-secondary btn-sm flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{trip.tripNumber}</h1>
                <p className="text-sm text-gray-600">Trip Details</p>
              </div>
            </div>
            
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              trip.status === 'completed' ? 'bg-green-100 text-green-800' :
              trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {trip.status}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Trip Basic Info */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trip Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Load Date</p>
                <p className="font-medium text-gray-900">{formatDate(trip.loadDate)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Truck className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-medium text-gray-900">{trip.vehicleId?.vehicleNumber || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Driver</p>
                <p className="font-medium text-gray-900">{trip.driverId?.fullName || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Details - Role Based */}
        {isClientView && clientData ? (
          // Single Client View
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Load Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">From</p>
                  <p className="font-medium text-gray-900">
                    {clientData.originCity?.cityName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To</p>
                  <p className="font-medium text-gray-900">
                    {clientData.destinationCity?.cityName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-medium text-gray-900">{clientData.weight || 'N/A'} tons</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Material</p>
                  <p className="font-medium text-gray-900">{clientData.material || 'N/A'}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Rate</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(clientData.clientRate)}
                    </p>
                  </div>
                  {clientData.adjustment !== 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Adjustment</p>
                      <p className={`text-lg font-bold ${
                        clientData.adjustment > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {clientData.adjustment > 0 ? '-' : '+'}{formatCurrency(Math.abs(clientData.adjustment))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Multiple Clients View (Driver/Fleet Owner)
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Load Details ({Array.isArray(clientData) ? clientData.length : 0} Clients)
            </h2>
            <div className="space-y-4">
              {Array.isArray(clientData) && clientData.map((client, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">
                        {client.clientId?.fullName || client.clientId?.companyName || 'N/A'}
                      </h3>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {formatCurrency(client.clientRate)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">From</p>
                      <p className="font-medium text-gray-900">
                        {client.originCity?.cityName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">To</p>
                      <p className="font-medium text-gray-900">
                        {client.destinationCity?.cityName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Weight</p>
                      <p className="font-medium text-gray-900">{client.weight || 'N/A'} tons</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Material</p>
                      <p className="font-medium text-gray-900">{client.material || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Driver View - Show Driver Calculation */}
        {user.role === 'driver' && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Earnings</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">Driver calculation details will be shown here</p>
              <p className="text-xs text-blue-600">Contact admin for detailed calculation</p>
            </div>
          </div>
        )}

        {/* Fleet Owner View - Show Vehicle Earnings */}
        {user.role === 'fleet_owner' && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Vehicle Earnings</h2>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(trip.totalClientRevenue || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Vehicle</p>
                  <p className="text-lg font-semibold text-green-900">
                    {trip.vehicleId?.vehicleNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
