'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { vehicleAPI, fleetOwnerAPI, driverAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function VehicleFormModal({ isOpen, onClose, onSuccess, editData = null }) {
  const [loading, setLoading] = useState(false);
  const [fleetOwners, setFleetOwners] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'documents', 'review'
  const [showAddFleetOwner, setShowAddFleetOwner] = useState(false);
  const [fleetOwnerSearch, setFleetOwnerSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [newFleetOwner, setNewFleetOwner] = useState({
    fullName: '',
    contact: '',
    email: '',
    address: ''
  });

  // Loan calculations
  const [loanCalculations, setLoanCalculations] = useState({
    elapsedMonths: 0,
    totalPaid: 0,
    remainingAmount: 0,
    remainingMonths: 0,
    loanProgress: 0
  });
  
  const [formData, setFormData] = useState({
    // Basic Details
    vehicleNumber: '',
    vehicleType: 'truck',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    capacityTons: '',
    fuelType: 'diesel',
    
    // Ownership
    ownershipType: 'self_owned',
    fleetOwnerId: '',
    defaultDriverId: '',
    
    // Identity
    engineNumber: '',
    chassisNumber: '',
    
    // Documents
    registrationDate: '',
    fitnessExpiryDate: '',
    insuranceExpiryDate: '',
    pucExpiryDate: '',
    permitExpiryDate: '',
    nationalPermitExpiryDate: '',
    taxValidUptoDate: '',
    
    // Loan
    hasLoan: false,
    loanDetails: {
      loanAmount: '',
      emiAmount: '',
      loanTenure: '',
      loanStartDate: '',
      loanProvider: '',
      interestRate: '',
      emiDueDate: 1
    },
    
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadFleetOwners();
      loadDrivers();
      if (editData) {
        setFormData({
          ...editData,
          defaultDriverId: editData.defaultDriverId?._id || '',
          loanDetails: editData.loanDetails || {
            loanAmount: '',
            emiAmount: '',
            loanTenure: '',
            loanStartDate: '',
            loanProvider: '',
            interestRate: '',
            emiDueDate: 1
          }
        });
      }
    }
  }, [isOpen, editData]);

  // Reset to basic tab when ownership type changes to fleet_owner
  useEffect(() => {
    if (formData.ownershipType === 'fleet_owner' && activeTab !== 'basic') {
      setActiveTab('basic');
    }
  }, [formData.ownershipType]);

  const loadFleetOwners = async () => {
    try {
      const response = await fleetOwnerAPI.getAll();
      setFleetOwners(response.data.data);
    } catch (error) {
      console.error('Error loading fleet owners:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await driverAPI.getAll();
      setDrivers(response.data.data);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleAddNewFleetOwner = async () => {
    if (!newFleetOwner.fullName || !newFleetOwner.contact) {
      toast.error('Name and contact are required');
      return;
    }

    try {
      const response = await fleetOwnerAPI.create(newFleetOwner);
      toast.success('Fleet owner added successfully!');
      
      // Reload fleet owners
      await loadFleetOwners();
      
      // Select the newly created fleet owner
      setFormData({
        ...formData,
        fleetOwnerId: response.data.data._id
      });
      
      // Reset and close add form
      setNewFleetOwner({ fullName: '', contact: '', email: '', address: '' });
      setShowAddFleetOwner(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add fleet owner');
    }
  };

  const filteredFleetOwners = fleetOwners.filter(owner =>
    owner.fullName.toLowerCase().includes(fleetOwnerSearch.toLowerCase()) ||
    owner.contact.includes(fleetOwnerSearch)
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.fullName.toLowerCase().includes(driverSearch.toLowerCase()) ||
    driver.contact.includes(driverSearch)
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('loan.')) {
      const loanField = name.split('.')[1];
      setFormData({
        ...formData,
        loanDetails: {
          ...formData.loanDetails,
          [loanField]: value
        }
      });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data
      const submitData = { ...formData };
      
      // Remove fleetOwnerId if self_owned
      if (submitData.ownershipType === 'self_owned') {
        submitData.fleetOwnerId = null;
      }
      
      // Remove loan details if no loan
      if (!submitData.hasLoan) {
        submitData.loanDetails = {};
      }

      if (editData) {
        await vehicleAPI.update(editData._id, submitData);
        toast.success('Vehicle updated successfully!');
      } else {
        await vehicleAPI.create(submitData);
        toast.success('Vehicle added successfully!');
      }
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Calculate loan details in real-time
  useEffect(() => {
    if (formData.hasLoan && formData.loanDetails.loanAmount && formData.loanDetails.emiAmount && formData.loanDetails.loanStartDate) {
      const startDate = new Date(formData.loanDetails.loanStartDate);
      const currentDate = new Date();
      
      // Calculate elapsed months
      const monthsDiff = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - startDate.getMonth());
      const elapsedMonths = Math.max(0, monthsDiff);
      
      // Calculate values
      const totalPaid = elapsedMonths * parseFloat(formData.loanDetails.emiAmount || 0);
      const loanAmount = parseFloat(formData.loanDetails.loanAmount || 0);
      const remainingAmount = Math.max(0, loanAmount - totalPaid);
      const loanTenure = parseInt(formData.loanDetails.loanTenure || 0);
      const remainingMonths = Math.max(0, loanTenure - elapsedMonths);
      const loanProgress = loanAmount > 0 ? Math.min(100, (totalPaid / loanAmount) * 100) : 0;
      
      setLoanCalculations({
        elapsedMonths,
        totalPaid,
        remainingAmount,
        remainingMonths,
        loanProgress
      });
    } else {
      setLoanCalculations({
        elapsedMonths: 0,
        totalPaid: 0,
        remainingAmount: 0,
        remainingMonths: 0,
        loanProgress: 0
      });
    }
  }, [formData.hasLoan, formData.loanDetails.loanAmount, formData.loanDetails.emiAmount, formData.loanDetails.loanStartDate, formData.loanDetails.loanTenure]);

  const resetForm = () => {
    setFormData({
      vehicleNumber: '',
      vehicleType: 'truck',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      capacityTons: '',
      fuelType: 'diesel',
      ownershipType: 'self_owned',
      fleetOwnerId: '',
      defaultDriverId: '',
      engineNumber: '',
      chassisNumber: '',
      registrationDate: '',
      fitnessExpiryDate: '',
      insuranceExpiryDate: '',
      pucExpiryDate: '',
      permitExpiryDate: '',
      nationalPermitExpiryDate: '',
      taxValidUptoDate: '',
      hasLoan: false,
      loanDetails: {
        loanAmount: '',
        emiAmount: '',
        loanTenure: '',
        loanStartDate: '',
        loanProvider: '',
        interestRate: '',
        emiDueDate: 1
      },
      description: ''
    });
    setActiveTab('basic');
    setShowAddFleetOwner(false);
    setFleetOwnerSearch('');
    setDriverSearch('');
    setNewFleetOwner({ fullName: '', contact: '', email: '', address: '' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editData ? 'Edit Vehicle' : 'Add New Vehicle'}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        {/* Tab Navigation - Hide extra tabs for fleet owner vehicles */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'basic'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Details
            </button>
            {formData.ownershipType === 'self_owned' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'documents'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Documents & Loan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'review'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Review
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Basic Details */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Number */}
              <div>
                <label className="label">
                  Vehicle Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  className="input uppercase"
                  placeholder="MH12AB1234"
                  required
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="label">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="truck">Truck</option>
                  <option value="container">Container</option>
                  <option value="mini_truck">Mini Truck</option>
                  <option value="trailer">Trailer</option>
                  <option value="tanker">Tanker</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Only show these fields for self-owned vehicles */}
              {formData.ownershipType === 'self_owned' && (
                <>
                  {/* Brand */}
                  <div>
                    <label className="label">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="input"
                      placeholder="Tata, Ashok Leyland, etc."
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="label">Model</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="input"
                      placeholder="LPT 1613"
                    />
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="label">
                      Capacity (Tons) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="capacityTons"
                      value={formData.capacityTons}
                      onChange={handleChange}
                      className="input"
                      placeholder="16"
                      step="0.1"
                      required
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <label className="label">Year of Manufacture</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="input"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="label">Fuel Type</label>
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="petrol">Petrol</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="label">Color</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="input"
                      placeholder="White, Blue, etc."
                    />
                  </div>

                  {/* Engine Number */}
                  <div>
                    <label className="label">Engine Number</label>
                    <input
                      type="text"
                      name="engineNumber"
                      value={formData.engineNumber}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>

                  {/* Chassis Number */}
                  <div>
                    <label className="label">Chassis Number</label>
                    <input
                      type="text"
                      name="chassisNumber"
                      value={formData.chassisNumber}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Ownership */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Ownership Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Ownership Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="ownershipType"
                    value={formData.ownershipType}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="self_owned">Self Owned</option>
                    <option value="fleet_owner">Fleet Owner</option>
                  </select>
                </div>

                {formData.ownershipType === 'fleet_owner' && (
                  <div className="md:col-span-2">
                    <label className="label">
                      Fleet Owner <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Search Input */}
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder="Search fleet owner by name or contact..."
                        value={fleetOwnerSearch}
                        onChange={(e) => setFleetOwnerSearch(e.target.value)}
                        className="input"
                      />
                    </div>

                    {/* Fleet Owner Select */}
                    <select
                      name="fleetOwnerId"
                      value={formData.fleetOwnerId}
                      onChange={handleChange}
                      className="input mb-2"
                      required={formData.ownershipType === 'fleet_owner'}
                    >
                      <option value="">Select Fleet Owner</option>
                      {filteredFleetOwners.map((owner) => (
                        <option key={owner._id} value={owner._id}>
                          {owner.fullName} - {owner.contact}
                        </option>
                      ))}
                    </select>

                    {/* Add New Fleet Owner Button */}
                    <button
                      type="button"
                      onClick={() => setShowAddFleetOwner(!showAddFleetOwner)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showAddFleetOwner ? '− Cancel' : '+ Add New Fleet Owner'}
                    </button>

                    {/* Add New Fleet Owner Form */}
                    {showAddFleetOwner && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                        <h4 className="font-medium text-gray-900">Add New Fleet Owner</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="label text-sm">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={newFleetOwner.fullName}
                              onChange={(e) => setNewFleetOwner({...newFleetOwner, fullName: e.target.value})}
                              className="input"
                              placeholder="Enter full name"
                            />
                          </div>

                          <div>
                            <label className="label text-sm">
                              Contact <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={newFleetOwner.contact}
                              onChange={(e) => setNewFleetOwner({...newFleetOwner, contact: e.target.value})}
                              className="input"
                              placeholder="Enter contact number"
                            />
                          </div>

                          <div>
                            <label className="label text-sm">Email</label>
                            <input
                              type="email"
                              value={newFleetOwner.email}
                              onChange={(e) => setNewFleetOwner({...newFleetOwner, email: e.target.value})}
                              className="input"
                              placeholder="Enter email"
                            />
                          </div>

                          <div>
                            <label className="label text-sm">Address</label>
                            <input
                              type="text"
                              value={newFleetOwner.address}
                              onChange={(e) => setNewFleetOwner({...newFleetOwner, address: e.target.value})}
                              className="input"
                              placeholder="Enter address"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddNewFleetOwner}
                          className="btn btn-primary text-sm"
                        >
                          Save Fleet Owner
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Default Driver - Only for Self Owned */}
            {formData.ownershipType === 'self_owned' && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Default Driver</h3>
                <p className="text-sm text-gray-600 mb-3">Select a default driver for this vehicle. This driver will be automatically selected when creating trips.</p>
                <div>
                  <label className="label">Default Driver (Optional)</label>
                  
                  {/* Search Input */}
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Search driver by name or contact..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Driver Select */}
                  <select
                    name="defaultDriverId"
                    value={formData.defaultDriverId}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">No Default Driver</option>
                    {filteredDrivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.fullName} - {driver.contact}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="label">Description / Notes</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Any additional information..."
              ></textarea>
            </div>
          </div>
        )}

        {/* Tab 2: Documents & Loan */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Documents Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Document Dates</h3>
              
              {/* Info Note */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Document dates can be entered here. To upload document images (Registration, Fitness, Insurance, PUC, Permit, etc.), please save the vehicle first and then use the "View" option to access the document upload section.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Registration Date</label>
                  <input
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Fitness Expiry Date</label>
                  <input
                    type="date"
                    name="fitnessExpiryDate"
                    value={formData.fitnessExpiryDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Insurance Expiry Date</label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    value={formData.insuranceExpiryDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">PUC Expiry Date</label>
                  <input
                    type="date"
                    name="pucExpiryDate"
                    value={formData.pucExpiryDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Permit Expiry Date</label>
                  <input
                    type="date"
                    name="permitExpiryDate"
                    value={formData.permitExpiryDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">National Permit Expiry</label>
                  <input
                    type="date"
                    name="nationalPermitExpiryDate"
                    value={formData.nationalPermitExpiryDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Tax Valid Upto Date</label>
                  <input
                    type="date"
                    name="taxValidUptoDate"
                    value={formData.taxValidUptoDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Loan Section */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  name="hasLoan"
                  checked={formData.hasLoan}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                  id="hasLoan"
                />
                <label htmlFor="hasLoan" className="text-lg font-semibold cursor-pointer">
                  ✅ This vehicle has a loan
                </label>
              </div>

              {formData.hasLoan && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="label">
                      Loan Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="loan.loanAmount"
                      value={formData.loanDetails.loanAmount}
                      onChange={handleChange}
                      className="input"
                      placeholder="500000"
                      required={formData.hasLoan}
                    />
                  </div>

                  <div>
                    <label className="label">
                      EMI Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="loan.emiAmount"
                      value={formData.loanDetails.emiAmount}
                      onChange={handleChange}
                      className="input"
                      placeholder="15000"
                      required={formData.hasLoan}
                    />
                  </div>

                  <div>
                    <label className="label">
                      Loan Tenure (Months) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="loan.loanTenure"
                      value={formData.loanDetails.loanTenure}
                      onChange={handleChange}
                      className="input"
                      placeholder="36"
                      required={formData.hasLoan}
                    />
                  </div>

                  <div>
                    <label className="label">
                      Loan Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="loan.loanStartDate"
                      value={formData.loanDetails.loanStartDate}
                      onChange={handleChange}
                      className="input"
                      required={formData.hasLoan}
                    />
                  </div>

                  <div>
                    <label className="label">Loan Provider</label>
                    <input
                      type="text"
                      name="loan.loanProvider"
                      value={formData.loanDetails.loanProvider}
                      onChange={handleChange}
                      className="input"
                      placeholder="HDFC Bank"
                    />
                  </div>

                  <div>
                    <label className="label">Interest Rate (%)</label>
                    <input
                      type="number"
                      name="loan.interestRate"
                      value={formData.loanDetails.interestRate}
                      onChange={handleChange}
                      className="input"
                      placeholder="10.5"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="label">EMI Due Date (Day of Month)</label>
                    <input
                      type="number"
                      name="loan.emiDueDate"
                      value={formData.loanDetails.emiDueDate}
                      onChange={handleChange}
                      className="input"
                      min="1"
                      max="31"
                      placeholder="5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Loan Calculator - Real-time Display */}
            {formData.hasLoan && formData.loanDetails.loanAmount && formData.loanDetails.emiAmount && formData.loanDetails.loanStartDate && (
              <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Loan Calculator</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Elapsed Months</div>
                    <div className="text-2xl font-bold text-blue-600">{loanCalculations.elapsedMonths}</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Total Paid</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(loanCalculations.totalPaid)}</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Remaining Amount</div>
                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(loanCalculations.remainingAmount)}</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Remaining Months</div>
                    <div className="text-2xl font-bold text-purple-600">{loanCalculations.remainingMonths}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">Loan Progress</span>
                    <span className="text-blue-600 font-bold">{loanCalculations.loanProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${loanCalculations.loanProgress}%` }}
                    >
                      {loanCalculations.loanProgress > 10 && (
                        <span className="text-xs text-white font-bold">{loanCalculations.loanProgress.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Review */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                Please review all the details before submitting. You can go back to edit any information.
              </p>
            </div>

            {/* Basic Details Review */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Basic Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Vehicle Number:</span>
                  <span className="ml-2 font-medium">{formData.vehicleNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium capitalize">{formData.vehicleType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Brand:</span>
                  <span className="ml-2 font-medium">{formData.brand || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Model:</span>
                  <span className="ml-2 font-medium">{formData.model || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Capacity:</span>
                  <span className="ml-2 font-medium">{formData.capacityTons} tons</span>
                </div>
                <div>
                  <span className="text-gray-600">Fuel Type:</span>
                  <span className="ml-2 font-medium capitalize">{formData.fuelType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ownership:</span>
                  <span className="ml-2 font-medium capitalize">{formData.ownershipType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Loan Details Review */}
            {formData.hasLoan && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Loan Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Loan Amount:</span>
                    <span className="ml-2 font-medium">₹{formData.loanDetails.loanAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">EMI Amount:</span>
                    <span className="ml-2 font-medium">₹{formData.loanDetails.emiAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tenure:</span>
                    <span className="ml-2 font-medium">{formData.loanDetails.loanTenure} months</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Provider:</span>
                    <span className="ml-2 font-medium">{formData.loanDetails.loanProvider || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Review */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Document Expiry Dates</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {formData.fitnessExpiryDate && (
                  <div>
                    <span className="text-gray-600">Fitness Expiry:</span>
                    <span className="ml-2 font-medium">{formData.fitnessExpiryDate}</span>
                  </div>
                )}
                {formData.insuranceExpiryDate && (
                  <div>
                    <span className="text-gray-600">Insurance Expiry:</span>
                    <span className="ml-2 font-medium">{formData.insuranceExpiryDate}</span>
                  </div>
                )}
                {formData.pucExpiryDate && (
                  <div>
                    <span className="text-gray-600">PUC Expiry:</span>
                    <span className="ml-2 font-medium">{formData.pucExpiryDate}</span>
                  </div>
                )}
                {formData.permitExpiryDate && (
                  <div>
                    <span className="text-gray-600">Permit Expiry:</span>
                    <span className="ml-2 font-medium">{formData.permitExpiryDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
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
            <span>{editData ? 'Update Vehicle' : 'Add Vehicle'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
