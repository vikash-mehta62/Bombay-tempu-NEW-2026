'use client';

import { useEffect, useState } from 'react';
import { driverAPI } from '@/lib/api';
import { Plus, Search, Filter, Edit, Trash2, Phone, Mail, Calendar, Eye } from 'lucide-react';
import { toast } from 'sonner';
import DriverFormModal from '@/components/DriverFormModal';
import DriverViewModal from '@/components/DriverViewModal';
import TruckLoader from '@/components/TruckLoader';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, [statusFilter]);

  const loadDrivers = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await driverAPI.getAll(params);
      setDrivers(response.data.data);
    } catch (error) {
      toast.error('Failed to load drivers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEditDriver = (driver) => {
    setEditData(driver);
    setShowModal(true);
  };

  const handleViewDriver = async (driver) => {
    console.log('View button clicked for driver:', driver);
    if (driver && driver._id) {
      try {
        // Fetch fresh driver data with all documents
        const response = await driverAPI.getById(driver._id);
        setSelectedDriver(response.data.data);
        setShowViewModal(true);
      } catch (error) {
        console.error('Error loading driver details:', error);
        toast.error('Failed to load driver details');
      }
    } else {
      console.error('Invalid driver data:', driver);
      toast.error('Unable to view driver details');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      await driverAPI.delete(id);
      toast.success('Driver deleted successfully');
      loadDrivers();
    } catch (error) {
      toast.error('Failed to delete driver');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditData(null);
  };

  const handleSuccess = () => {
    loadDrivers();
  };

  const filteredDrivers = drivers.filter((driver) =>
    driver.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.contact.includes(searchTerm) ||
    driver.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      on_trip: 'bg-blue-100 text-blue-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      terminated: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <TruckLoader size="lg" message="Loading drivers..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600">Manage your driver workforce</p>
        </div>
        <button
          onClick={handleAddDriver}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍✈️</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {drivers.filter(d => d.status === 'available').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On Trip</p>
              <p className="text-2xl font-bold text-blue-600">
                {drivers.filter(d => d.status === 'on_trip').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🚛</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-yellow-600">
                {drivers.filter(d => d.status === 'on_leave').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏖️</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">
                {drivers.filter(d => d.status === 'inactive' || d.status === 'terminated').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏸️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search drivers by name, contact, or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No drivers found
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-gray-50"
                    style={{ position: 'relative' }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {driver.fullName}
                        </div>
                        {driver.currentVehicle && (
                          <div className="text-xs text-gray-500">
                            🚛 {driver.currentVehicle.vehicleNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {driver.contact}
                        </div>
                        {driver.email && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            {driver.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">
                          {driver.licenseNumber || 'N/A'}
                        </div>
                        {driver.licenseExpiry && (
                          <div className="text-xs text-gray-500">
                            Exp: {formatDate(driver.licenseExpiry)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {formatDate(driver.joiningDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${getStatusBadgeColor(driver.status)}`}
                      >
                        {driver.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('View clicked for:', driver.fullName);
                            handleViewDriver(driver);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 cursor-pointer"
                          title="View"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Edit clicked for:', driver.fullName);
                            handleEditDriver(driver);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 cursor-pointer"
                          title="Edit"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Delete clicked for:', driver.fullName);
                            handleDelete(driver._id);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 cursor-pointer"
                          title="Delete"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing {filteredDrivers.length} of {drivers.length} drivers
        </p>
      </div>

      {/* Driver Form Modal */}
      <DriverFormModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        editData={editData}
      />

      {/* Driver View Modal */}
      {showViewModal && selectedDriver && (
        <DriverViewModal
          isOpen={showViewModal}
          onClose={() => {
            console.log('Closing driver view modal');
            setShowViewModal(false);
            setSelectedDriver(null);
          }}
          driver={selectedDriver}
        />
      )}
    </div>
  );
}
