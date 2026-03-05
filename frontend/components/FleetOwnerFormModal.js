'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { fleetOwnerAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Info } from 'lucide-react';

export default function FleetOwnerFormModal({ isOpen, onClose, onSuccess, editData = null }) {
  const [loading, setLoading] = useState(false);
  
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
    if (isOpen && editData) {
      setFormData({
        fullName: editData.fullName || '',
        companyName: editData.companyName || '',
        contact: editData.contact || '',
        email: editData.email || '',
        address: editData.address || '',
        panNumber: editData.panNumber || '',
        gstNumber: editData.gstNumber || '',
        bankDetails: {
          accountNumber: editData.bankDetails?.accountNumber || '',
          ifscCode: editData.bankDetails?.ifscCode || '',
          bankName: editData.bankDetails?.bankName || '',
          accountHolderName: editData.bankDetails?.accountHolderName || ''
        }
      });
    } else if (isOpen && !editData) {
      // Reset form for new fleet owner
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
  }, [isOpen, editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bank.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        bankDetails: {
          ...formData.bankDetails,
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
        await fleetOwnerAPI.update(editData._id, formData);
        toast.success('Fleet Owner updated successfully!');
      } else {
        await fleetOwnerAPI.create(formData);
        toast.success('Fleet Owner added successfully! Default password: 12345678');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save fleet owner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editData ? 'Edit Fleet Owner' : 'Add New Fleet Owner'}
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
                Fleet Owner can change this password after first login
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

              <div className="md:col-span-2">
                <label className="label">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter company name"
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
                  placeholder="owner@example.com"
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
            </div>
          </div>

          {/* Business Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  className="input uppercase"
                  placeholder="ABCDE1234F"
                  maxLength="10"
                />
              </div>

              <div>
                <label className="label">GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="input uppercase"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength="15"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Account Holder Name</label>
                <input
                  type="text"
                  name="bank.accountHolderName"
                  value={formData.bankDetails.accountHolderName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter account holder name"
                />
              </div>

              <div>
                <label className="label">Account Number</label>
                <input
                  type="text"
                  name="bank.accountNumber"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="label">IFSC Code</label>
                <input
                  type="text"
                  name="bank.ifscCode"
                  value={formData.bankDetails.ifscCode}
                  onChange={handleChange}
                  className="input uppercase"
                  placeholder="SBIN0001234"
                />
              </div>

              <div>
                <label className="label">Bank Name</label>
                <input
                  type="text"
                  name="bank.bankName"
                  value={formData.bankDetails.bankName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter bank name"
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
            <span>{editData ? 'Update Fleet Owner' : 'Add Fleet Owner'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
