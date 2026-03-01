'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { clientAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Info } from 'lucide-react';

export default function ClientFormModal({ isOpen, onClose, onSuccess, editData = null }) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    contact: '',
    email: '',
    address: '',
    gstNumber: '',
    panNumber: '',
    billingAddress: '',
    creditLimit: '',
    clientType: 'individual',
    status: 'active'
  });

  useEffect(() => {
    if (isOpen && editData) {
      setFormData({
        fullName: editData.fullName || '',
        companyName: editData.companyName || '',
        contact: editData.contact || '',
        email: editData.email || '',
        address: editData.address || '',
        gstNumber: editData.gstNumber || '',
        panNumber: editData.panNumber || '',
        billingAddress: editData.billingAddress || '',
        creditLimit: editData.creditLimit || '',
        clientType: editData.clientType || 'individual',
        status: editData.status || 'active'
      });
    } else if (isOpen && !editData) {
      // Reset form for new client
      setFormData({
        fullName: '',
        companyName: '',
        contact: '',
        email: '',
        address: '',
        gstNumber: '',
        panNumber: '',
        billingAddress: '',
        creditLimit: '',
        clientType: 'individual',
        status: 'active'
      });
    }
  }, [isOpen, editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editData) {
        await clientAPI.update(editData._id, formData);
        toast.success('Client updated successfully!');
      } else {
        await clientAPI.create(formData);
        toast.success('Client added successfully! Default password: 12345678');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editData ? 'Edit Client' : 'Add New Client'}
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
                Client can change this password after first login
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Client Type */}
          <div>
            <label className="label">
              Client Type <span className="text-red-500">*</span>
            </label>
            <select
              name="clientType"
              value={formData.clientType}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </select>
          </div>

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

              {formData.clientType === 'company' && (
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
              )}

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
                  placeholder="client@example.com"
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
                <label className="label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="md:col-span-2">
                <label className="label">Billing Address</label>
                <textarea
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleChange}
                  className="input"
                  rows="2"
                  placeholder="Enter billing address (if different from address)"
                ></textarea>
              </div>

              <div>
                <label className="label">Credit Limit (₹)</label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  className="input"
                  placeholder="50000"
                  min="0"
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
            <span>{editData ? 'Update Client' : 'Add Client'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
