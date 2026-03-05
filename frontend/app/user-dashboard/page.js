'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Phone, Mail, MapPin, Truck, FileText, Calendar, Building2, Edit } from 'lucide-react';
import { driverAPI, fleetOwnerAPI, clientAPI, tripAPI } from '@/lib/api';
import { toast } from 'sonner';
import DriverViewModal from '@/components/DriverViewModal';
import VehicleViewModal from '@/components/VehicleViewModal';
import ClientViewModal from '@/components/ClientViewModal';
import FleetOwnerViewModal from '@/components/FleetOwnerViewModal';
import DriverFormModal from '@/components/DriverFormModal';
import ClientFormModal from '@/components/ClientFormModal';
import FleetOwnerFormModal from '@/components/FleetOwnerFormModal';

export default function UserDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadTrips();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      let response;
      if (user.role === 'driver') {
        response = await driverAPI.getById(user._id);
      } else if (user.role === 'fleet_owner') {
        response = await fleetOwnerAPI.getById(user._id);
      } else if (user.role === 'client') {
        response = await clientAPI.getById(user._id);
      }
      setUserData(response.data.data);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    }
  };

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getAll();
      const allTrips = response.data.data;
      
      // Filter trips based on user role
      let userTrips = [];
      if (user.role === 'driver') {
        userTrips = allTrips.filter(trip => trip.driverId?._id === user._id);
      } else if (user.role === 'fleet_owner') {
        userTrips = allTrips.filter(trip => trip.vehicleId?.fleetOwnerId?._id === user._id);
      } else if (user.role === 'client') {
        userTrips = allTrips.filter(trip => 
          trip.clients?.some(c => c.clientId?._id === user._id)
        );
      }
      
      setTrips(userTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
      toast.error('Failed to load trips');
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

  const getRoleTitle = () => {
    if (user.role === 'driver') return 'Driver Dashboard';
    if (user.role === 'fleet_owner') return 'Fleet Owner Dashboard';
    if (user.role === 'client') return 'Client Dashboard';
    return 'Dashboard';
  };

  const getRoleIcon = () => {
    if (user.role === 'driver') return <User className="w-8 h-8 text-blue-600" />;
    if (user.role === 'fleet_owner') return <Building2 className="w-8 h-8 text-blue-600" />;
    if (user.role === 'client') return <User className="w-8 h-8 text-blue-600" />;
    return <User className="w-8 h-8 text-blue-600" />;
  };

  const openProfileModal = () => {
    if (userData) {
      setShowModal(true);
    }
  };

  const openEditModal = () => {
    if (userData) {
      setShowEditModal(true);
    }
  };

  const handleEditSuccess = () => {
    loadUserData(); // Reload user data after edit
    setShowEditModal(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {getRoleIcon()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getRoleTitle()}</h1>
              <p className="text-gray-600">Welcome back, {user.fullName}!</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={openEditModal}
                className="btn btn-primary btn-sm flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={openProfileModal}
                className="btn btn-secondary btn-sm"
              >
                View Full Profile
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{user.fullName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium text-gray-900">{user.contact}</p>
              </div>
            </div>
            
            {user.email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
            )}
            
            {user.companyName && (
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium text-gray-900">{user.companyName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trips Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Trips</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {trips.length} Total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No trips found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => {
                const firstClient = trip.clients?.[0];
                const fromCity = firstClient?.originCity?.cityName || 'N/A';
                const toCity = firstClient?.destinationCity?.cityName || 'N/A';
                
                return (
                  <div
                    key={trip._id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.href = `/trip/${trip._id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{trip.tripNumber}</h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(trip.loadDate)}
                          </p>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                        trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">From</p>
                        <p className="font-medium text-gray-900">{fromCity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">To</p>
                        <p className="font-medium text-gray-900">{toCity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vehicle</p>
                        <p className="font-medium text-gray-900">
                          {trip.vehicleId?.vehicleNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Driver</p>
                        <p className="font-medium text-gray-900">
                          {trip.driverId?.fullName || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showModal && userData && user.role === 'driver' && (
        <DriverViewModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          driver={userData}
          isAdminView={false}
        />
      )}
      
      {showModal && userData && user.role === 'client' && (
        <ClientViewModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          client={userData}
          isAdminView={false}
        />
      )}
      
      {showModal && userData && user.role === 'fleet_owner' && (
        <FleetOwnerViewModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          fleetOwner={userData}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditModal && userData && user.role === 'driver' && (
        <DriverFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          editData={userData}
        />
      )}
      
      {showEditModal && userData && user.role === 'client' && (
        <ClientFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          editData={userData}
        />
      )}
      
      {showEditModal && userData && user.role === 'fleet_owner' && (
        <FleetOwnerFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          editData={userData}
        />
      )}
    </div>
  );
}
