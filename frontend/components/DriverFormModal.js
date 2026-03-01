'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { driverAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Info } from 'lucide-react';

export default function DriverFormModal({ isOpen, onClose, onSuccess, editData = null }) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    contact: '',
    email: '',
    address: '',
    licenseNumber: '',
    licenseExpiry: '',
    dateOfBirth: '',
    joiningDate: new Date().toISOString().split('T')[0],
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    },
    status: 'active'
  });

  useEffect(() => {
    if (isOpen && editData) {
      setFormData({
        fullName: editData.fullName || '',
        contact: editData.contact || '',
        email: editData.email || '',
        address: editData.address || '',
        licenseNumber: editData.licenseNumber || '',
        licenseExpiry: editData.licenseExpiry ? editData.licenseExpiry.split('T')[0] : '',
        dateOfBirth: editData.dateOfBirth ? editData.dateOfBirth.split('T')[0] : '',
        joiningDate: editData.joiningDate ? editData.joiningDate.split('T')[0] : '',
        emergencyContact: editData.emergencyContact || {
          name: '',
          phone: '',
          relation: ''
        },
        status: editData.status || 'active'
      });
    } else if (isOpen && !editData) {
      // Reset form for new driver
      setFormData({
        fullName: '',
        contact: '',
        email: '',
        address: '',
        licenseNumber: '',
        licenseExpiry: '',
        dateOfBirth: '',
        joiningDate: new Date().toISOString().split('T')[0],
        emergencyContact: {
          name: '',
          phone: '',
          relation: ''
        },
        status: 'active'
      });
    }
  }, [isOpen, editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        emergencyContact: {
          ...formData.emergencyContact,
          [field]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editData) {
        await driverAPI.update(editData._id, formData);
        toast.success('Driver updated successfully!');
      } else {
        await driverAPI.create(formData);
        toast.success('Driver added successfully! Default password: 12345678');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editData ? 'Edit Driver' : 'Add New Driver'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* Password Info Banner */}
        {!editData && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Default password will be set to "12345678"
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Driver can change this password after first login
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="label">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="input"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="driver@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input"
                  rows="2"
                  placeholder="Enter full address"
                ></textarea>
              </div>

              <div>
                <label className="label">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Joining Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">License Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="input"
                  placeholder="DL1234567890"
                />
              </div>

              <div>
                <label className="label">License Expiry Date</label>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Contact Name</label>
                <input
                  type="text"
                  name="emergency.name"
                  value={formData.emergencyContact.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="label">Contact Phone</label>
                <input
                  type="text"
                  name="emergency.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="label">Relation</label>
                <input
                  type="text"
                  name="emergency.relation"
                  value={formData.emergencyContact.relation}
                  onChange={handleChange}
                  className="input"
                  placeholder="Father, Brother, etc."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{editData ? 'Update Driver' : 'Add Driver'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
