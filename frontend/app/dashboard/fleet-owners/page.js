'use client';

import { useState, useEffect } from 'react';
import { fleetOwnerAPI } from '@/lib/api';
import { toast } from 'sonner';
import FleetOwnerViewModal from '@/components/FleetOwnerViewModal';
import TruckLoader from '@/components/TruckLoader';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2,
  Phone,
  Mail,
  Building
} from 'lucide-react';

export default function FleetOwnersPage() {
  const [fleetOwners, setFleetOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    contact: '',
    email: '',
    address: '',
    panNumber: '',
    gstNumber: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: ''
    }
  });

  useEffect(() => {
    loadFleetOwners();
  }, []);

  const loadFleetOwners = async () => {
    try {
      setLoading(true);
      const response = await fleetOwnerAPI.getAll();
      setFleetOwners(response.data.data || []);
    } catch (error) {
      console.error('Error loading fleet owners:', error);
      toast.error('Failed to load fleet owners');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (owner = null) => {
    if (owner) {
      setIsEditing(true);
      setSelectedOwner(owner);
      setFormData({
        fullName: owner.fullName || '',
        companyName: owner.companyName || '',
        contact: owner.contact || '',
        email: owner.email || '',
        address: owner.address || '',
        panNumber: owner.panNumber || '',
        gstNumber: owner.gstNumber || '',
        bankDetails: {
          accountNumber: owner.bankDetails?.accountNumber || '',
          ifscCode: owner.bankDetails?.ifscCode || '',
          bankName: owner.bankDetails?.bankName || '',
          accountHolderName: owner.bankDetails?.accountHolderName || ''
        }
      });
    } else {
      setIsEditing(false);
      setSelectedOwner(null);
      setFormData({
        fullName: '',
        companyName: '',
        contact: '',
        email: '',
        address: '',
        panNumber: '',
        gstNumber: '',
        bankDetails: {
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          accountHolderName: ''
        }
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await fleetOwnerAPI.update(selectedOwner._id, formData);
        toast.success('Fleet owner updated successfully');
      } else {
        await fleetOwnerAPI.create(formData);
        toast.success('Fleet owner created successfully');
      }
      setShowModal(false);
      loadFleetOwners();
    } catch (error) {
      console.error('Error saving fleet owner:', error);
      toast.error(error.response?.data?.message || 'Failed to save fleet owner');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this fleet owner?')) return;
    
    try {
      await fleetOwnerAPI.delete(id);
      toast.success('Fleet owner deleted successfully');
      loadFleetOwners();
    } catch (error) {
      console.error('Error deleting fleet owner:', error);
      toast.error('Failed to delete fleet owner');
    }
  };

  const filteredOwners = fleetOwners.filter(owner =>
    owner.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.contact?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <TruckLoader size="lg" message="Loading fleet owners..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Owners</h1>
          <p className="text-sm text-gray-600 mt-1">Manage fleet owners and their details</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Fleet Owner</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, company, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Fleet Owners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOwners.map((owner) => (
          <div key={owner._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{owner.fullName}</h3>
                  {owner.companyName && (
                    <p className="text-sm text-gray-600">{owner.companyName}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {owner.contact && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {owner.contact}
                </div>
              )}
              {owner.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {owner.email}
                </div>
              )}
              {owner.address && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  {owner.address}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <button
                onClick={() => handleOpenModal(owner)}
                className="flex-1 btn btn-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center space-x-1"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  setSelectedOwner(owner);
                  setShowViewModal(true);
                }}
                className="flex-1 btn btn-sm bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              <button
                onClick={() => handleDelete(owner._id)}
                className="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredOwners.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fleet Owners Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first fleet owner'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => handleOpenModal()}
              className="btn bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Fleet Owner
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {isEditing ? 'Edit Fleet Owner' : 'Add Fleet Owner'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input w-full"
                      rows="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                        })}
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.ifscCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }
                        })}
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.bankName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                        })}
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountHolderName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                        })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isEditing ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 btn bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Owner View Modal */}
      {showViewModal && selectedOwner && (
        <FleetOwnerViewModal
          fleetOwner={selectedOwner}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedOwner(null);
          }}
        />
      )}
    </div>
  );
}
