'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Modal from './Modal';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar,
  CreditCard,
  Briefcase,
  Loader,
  Download,
  Truck,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  X,
  Upload,
  Trash2,
  Eye
} from 'lucide-react';
import { tripAPI, tripAdvanceAPI, driverAPI } from '@/lib/api';
import { toast } from 'sonner';
import DriverCalculationTab from './DriverCalculationTab';
import DriverDocumentUpload from './DriverDocumentUpload';

// Trip History Tab Component
function DriverTripHistoryTab({ driver, formatCurrency, formatDate }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    activeTrips: 0
  });

  useEffect(() => {
    if (driver?._id) {
      loadTrips();
    }
  }, [driver]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getAll();
      const allTrips = response.data.data;
      
      // Filter trips for this driver
      const driverTrips = allTrips.filter(trip => 
        trip.driverId?._id === driver._id && trip.isActive
      );
      
      setTrips(driverTrips);
      setStats({
        totalTrips: driverTrips.length,
        completedTrips: driverTrips.filter(t => t.status === 'completed').length,
        activeTrips: driverTrips.filter(t => t.status === 'in_progress').length
      });
    } catch (error) {
      console.error('Error loading trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Total Trips</p>
          <p className="text-2xl font-bold text-blue-900">{stats.totalTrips}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-900">{stats.completedTrips}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-700 font-medium">Active</p>
          <p className="text-2xl font-bold text-orange-900">{stats.activeTrips}</p>
        </div>
      </div>

      {/* Trips List */}
      <div className="space-y-3">
        {trips.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No trips found</p>
          </div>
        ) : (
          trips.map(trip => {
            // Get first client's route for display
            const firstClient = trip.clients?.[0];
            const fromCity = firstClient?.originCity?.cityName || 'N/A';
            const toCity = firstClient?.destinationCity?.cityName || 'N/A';
            
            return (
              <div key={trip._id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <a 
                    href={user?.role === 'user' ? `/trip/${trip._id}` : `/dashboard/trips/${trip._id}`}
                    className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = user?.role === 'user' ? `/trip/${trip._id}` : `/dashboard/trips/${trip._id}`;
                    }}
                  >
                    {trip.tripNumber}
                  </a>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                    trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {trip.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">From:</span> {fromCity}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">To:</span> {toCity}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span> {formatDate(trip.loadDate)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Vehicle:</span> {trip.vehicleId?.vehicleNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Advances Tab Component
function DriverAdvancesTab({ driver, formatCurrency, formatDate }) {
  const [loading, setLoading] = useState(true);
  const [advances, setAdvances] = useState([]);
  const [totalAdvances, setTotalAdvances] = useState(0);

  useEffect(() => {
    if (driver?._id) {
      loadAdvances();
    }
  }, [driver]);

  const loadAdvances = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getAll();
      const allTrips = response.data.data;
      
      // Filter trips for this driver
      const driverTrips = allTrips.filter(trip => 
        trip.driverId?._id === driver._id && trip.isActive
      );
      
      // Collect all advances
      const allAdvances = [];
      let total = 0;
      
      for (const trip of driverTrips) {
        try {
          const advResponse = await tripAdvanceAPI.getByTrip(trip._id);
          const tripAdvances = advResponse.data.data || [];
          
          tripAdvances.forEach(adv => {
            allAdvances.push({
              ...adv,
              tripNumber: trip.tripNumber,
              tripId: trip._id
            });
            total += adv.amount || 0;
          });
        } catch (error) {
          console.error('Error loading advances for trip:', trip._id);
        }
      }
      
      // Sort by date
      allAdvances.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setAdvances(allAdvances);
      setTotalAdvances(total);
    } catch (error) {
      console.error('Error loading advances:', error);
      toast.error('Failed to load advances');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Trip Number', 'Date', 'Amount', 'Payment Method', 'Description'];
      const rows = advances.map(adv => [
        adv.tripNumber,
        formatDate(adv.date),
        adv.amount,
        adv.paymentMethod,
        adv.description || ''
      ]);
      
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });
      
      csvContent += '\n';
      csvContent += `"Total Advances","","${totalAdvances}","",""\n`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${driver.fullName}_advances_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 font-medium">Total Advances</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAdvances)}</p>
            <p className="text-xs text-green-600 mt-1">{advances.length} payments</p>
          </div>
          <button
            onClick={exportToCSV}
            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Advances List */}
      <div className="space-y-3">
        {advances.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No advances found</p>
          </div>
        ) : (
          advances.map(adv => (
            <div key={adv._id} className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <a 
                    href={user?.role === 'user' ? `/trip/${adv.tripId}` : `/dashboard/trips/${adv.tripId}`}
                    className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = user?.role === 'user' ? `/trip/${adv.tripId}` : `/dashboard/trips/${adv.tripId}`;
                    }}
                  >
                    {adv.tripNumber}
                  </a>
                  <p className="text-xs text-gray-600">{formatDate(adv.date)}</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(adv.amount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Method: {adv.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-600">{adv.description || 'No description'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DriverViewModal({ isOpen, onClose, driver, isAdminView = true }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [driverData, setDriverData] = useState(driver);

  // Update driverData when driver prop changes
  useEffect(() => {
    if (driver) {
      setDriverData(driver);
    }
  }, [driver]);

  // Reload driver data when documents are updated
  const handleDocumentUpdate = async () => {
    try {
      if (driver?._id) {
        const response = await driverAPI.getById(driver._id);
        setDriverData(response.data.data);
      }
    } catch (error) {
      console.error('Error reloading driver:', error);
    }
  };
  
  if (!driverData) return null;

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Driver Details - ${driverData.fullName}`}
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
            Driver Information
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'trips'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Trip History
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'advances'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Advances
          </button>
          <button
            onClick={() => setActiveTab('calculation')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'calculation'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Driver Calculation
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Driver Details Tab */}
        {activeTab === 'details' && (
          <>
            {/* Basic Information */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-semibold text-gray-900">{driver.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="text-sm font-medium text-gray-900">{driver.contact}</p>
                </div>
                {driver.email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{driver.email}</p>
                  </div>
                )}
                {driver.address && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900">{driver.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    driver.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {driver.status}
                  </span>
                </div>
              </div>
            </div>

            {/* License Information */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">License Information</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">License Number</p>
                  <p className="text-sm font-semibold text-gray-900">{driver.licenseNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">License Expiry</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(driver.licenseExpiry)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Joining Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(driver.joiningDate)}</p>
                </div>
              </div>
            </div>

            {/* Documents Upload */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              </div>
              <DriverDocumentUpload 
                driver={driverData} 
                onUpdate={handleDocumentUpdate}
                isAdminView={isAdminView}
              />
            </div>

            {/* Emergency Contact */}
            {driver.emergencyContact && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {driver.emergencyContact.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {driver.emergencyContact.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Relationship</p>
                    <p className="text-sm font-medium text-gray-900">
                      {driverData.emergencyContact.relationship || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Trip History Tab */}
        {activeTab === 'trips' && (
          <DriverTripHistoryTab driver={driverData} formatCurrency={formatCurrency} formatDate={formatDate} />
        )}

        {/* Advances Tab */}
        {activeTab === 'advances' && (
          <DriverAdvancesTab driver={driverData} formatCurrency={formatCurrency} formatDate={formatDate} />
        )}

        {/* Driver Calculation Tab */}
        {activeTab === 'calculation' && (
          <DriverCalculationTab 
            driver={driverData} 
            formatCurrency={formatCurrency} 
            formatDate={formatDate}
            isAdminView={isAdminView}
          />
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
