'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { tripAPI, vehicleAPI, driverAPI, clientAPI, cityAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Plus, Search, X } from 'lucide-react';

export default function TripFormModal({ isOpen, onClose, onSuccess, editData = null }) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Search states
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [clientSearch, setClientSearch] = useState([]);
  const [originSearch, setOriginSearch] = useState([]);
  const [destinationSearch, setDestinationSearch] = useState([]);
  
  // Add new modals
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showAddClient, setShowAddClient] = useState([]);
  const [showAddOrigin, setShowAddOrigin] = useState([]);
  const [showAddDestination, setShowAddDestination] = useState([]);
  
  // New entity forms
  const [newCity, setNewCity] = useState({ cityName: '', state: '', pincode: '' });
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    tripDateTime: new Date().toISOString().slice(0, 16),
    loadDate: new Date().toISOString().split('T')[0],
    clients: [{
      clientId: '',
      originCity: '',
      destinationCity: '',
      loadDate: new Date().toISOString().split('T')[0],
      clientRate: '',
      truckHireCost: '',
      adjustment: '',
      packagingType: 'boxes',
      specialInstructions: ''
    }],
    overallTripRate: '',
    commissionType: 'none',
    commissionAmount: '',
    podBalance: '',
    additionalInstructions: ''
  });

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      
      // Load edit data if provided
      if (editData) {
        setFormData({
          vehicleId: editData.vehicleId?._id || '',
          driverId: editData.driverId?._id || '',
          tripDateTime: editData.tripDateTime ? new Date(editData.tripDateTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          loadDate: editData.loadDate ? new Date(editData.loadDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          clients: editData.clients?.map(client => ({
            clientId: client.clientId?._id || '',
            originCity: client.originCity?._id || '',
            destinationCity: client.destinationCity?._id || '',
            loadDate: client.loadDate ? new Date(client.loadDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            clientRate: client.clientRate || '',
            truckHireCost: client.truckHireCost || '',
            adjustment: client.adjustment || '',
            packagingType: client.packagingType || 'boxes',
            specialInstructions: client.specialInstructions || ''
          })) || [{
            clientId: '',
            originCity: '',
            destinationCity: '',
            loadDate: new Date().toISOString().split('T')[0],
            clientRate: '',
            truckHireCost: '',
            adjustment: '',
            packagingType: 'boxes',
            specialInstructions: ''
          }],
          overallTripRate: editData.overallTripRate || '',
          commissionType: editData.commissionType || 'none',
          commissionAmount: editData.commissionAmount || '',
          podBalance: editData.podBalance || '',
          additionalInstructions: editData.additionalInstructions || ''
        });
        
        // Set selected vehicle
        if (editData.vehicleId) {
          setSelectedVehicle(editData.vehicleId);
        }
        
        // Initialize search arrays for clients
        if (editData.clients) {
          setClientSearch(new Array(editData.clients.length).fill(''));
          setOriginSearch(new Array(editData.clients.length).fill(''));
          setDestinationSearch(new Array(editData.clients.length).fill(''));
          setShowAddClient(new Array(editData.clients.length).fill(false));
          setShowAddOrigin(new Array(editData.clients.length).fill(false));
          setShowAddDestination(new Array(editData.clients.length).fill(false));
        }
      } else {
        // Reset form for new trip
        setFormData({
          vehicleId: '',
          driverId: '',
          tripDateTime: new Date().toISOString().slice(0, 16),
          loadDate: new Date().toISOString().split('T')[0],
          clients: [{
            clientId: '',
            originCity: '',
            destinationCity: '',
            loadDate: new Date().toISOString().split('T')[0],
            clientRate: '',
            truckHireCost: '',
            adjustment: '',
            packagingType: 'boxes',
            specialInstructions: ''
          }],
          overallTripRate: '',
          commissionType: 'none',
          commissionAmount: '',
          podBalance: '',
          additionalInstructions: ''
        });
        setSelectedVehicle(null);
        setClientSearch(['']);
        setOriginSearch(['']);
        setDestinationSearch(['']);
        setShowAddClient([false]);
        setShowAddOrigin([false]);
        setShowAddDestination([false]);
      }
    }
  }, [isOpen, editData]);

  const loadData = async () => {
    try {
      const [vehiclesRes, driversRes, clientsRes, citiesRes] = await Promise.all([
        vehicleAPI.getAll(),
        driverAPI.getAll(),
        clientAPI.getAll(),
        cityAPI.getAll()
      ]);
      
      // Show all vehicles (no filtering)
      setVehicles(vehiclesRes.data.data);
      
      // Show all drivers (no filtering)
      setDrivers(driversRes.data.data);
      
      setClients(clientsRes.data.data);
      setCities(citiesRes.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleVehicleChange = (vehicleId) => {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    setSelectedVehicle(vehicle);
    setFormData({ ...formData, vehicleId, driverId: '' });
  };

  const handleAddClient = () => {
    setFormData({
      ...formData,
      clients: [...formData.clients, {
        clientId: '',
        originCity: '',
        destinationCity: '',
        loadDate: new Date().toISOString().split('T')[0],
        clientRate: '',
        truckHireCost: '',
        adjustment: '',
        packagingType: 'boxes',
        specialInstructions: ''
      }]
    });
    setClientSearch([...clientSearch, '']);
    setOriginSearch([...originSearch, '']);
    setDestinationSearch([...destinationSearch, '']);
    setShowAddClient([...showAddClient, false]);
    setShowAddOrigin([...showAddOrigin, false]);
    setShowAddDestination([...showAddDestination, false]);
  };

  const handleRemoveClient = (index) => {
    const newClients = formData.clients.filter((_, i) => i !== index);
    setFormData({ ...formData, clients: newClients });
    setClientSearch(clientSearch.filter((_, i) => i !== index));
    setOriginSearch(originSearch.filter((_, i) => i !== index));
    setDestinationSearch(destinationSearch.filter((_, i) => i !== index));
  };

  const handleClientChange = (index, field, value) => {
    const newClients = [...formData.clients];
    newClients[index][field] = value;
    setFormData({ ...formData, clients: newClients });
  };

  const handleAddNewCity = async (type, index = null) => {
    if (!newCity.cityName || !newCity.state) {
      toast.error('City name and state are required');
      return;
    }

    try {
      const response = await cityAPI.create(newCity);
      toast.success('City added successfully!');
      
      // Reload cities
      const citiesRes = await cityAPI.getAll();
      setCities(citiesRes.data.data);
      
      // Select the newly created city
      if (type === 'origin' && index !== null) {
        handleClientChange(index, 'originCity', response.data.data._id);
        const newShowAddOrigin = [...showAddOrigin];
        newShowAddOrigin[index] = false;
        setShowAddOrigin(newShowAddOrigin);
      } else if (type === 'destination' && index !== null) {
        handleClientChange(index, 'destinationCity', response.data.data._id);
        const newShowAddDestination = [...showAddDestination];
        newShowAddDestination[index] = false;
        setShowAddDestination(newShowAddDestination);
      }
      
      // Reset form
      setNewCity({ cityName: '', state: '', pincode: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add city');
    }
  };

  const calculateProfitLoss = () => {
    const totalRevenue = formData.clients.reduce((sum, client) => 
      sum + (parseFloat(client.clientRate) || 0), 0);
    
    // Adjustments are NOT included in profit calculation anymore
    const totalAdjustments = formData.clients.reduce((sum, client) => 
      sum + (parseFloat(client.adjustment) || 0), 0);
    
    // Check if fleet-owned or self-owned
    const isFleetOwned = selectedVehicle?.ownershipType === 'fleet_owner';
    
    let totalCosts = 0;
    let profitLoss = 0;
    let commissionEffect = 0;
    let podBalance = 0;
    
    if (isFleetOwned) {
      // Fleet-Owned: Commission and POD applicable
      const commissionAmount = parseFloat(formData.commissionAmount) || 0;
      podBalance = parseFloat(formData.podBalance) || 0;
      
      if (formData.commissionType === 'from_fleet_owner') {
        commissionEffect = commissionAmount; // ADD to profit
      } else if (formData.commissionType === 'to_fleet_owner') {
        commissionEffect = -commissionAmount; // SUBTRACT from profit
      }
      
      // Fleet-Owned: Profit = Revenue - Hire Cost + Commission + POD (NO ADJUSTMENT)
      totalCosts = formData.clients.reduce((sum, client) => 
        sum + (parseFloat(client.truckHireCost) || 0), 0);
      profitLoss = totalRevenue - totalCosts + commissionEffect + podBalance;
    } else {
      // Self-Owned: Profit = Revenue (NO ADJUSTMENT)
      // No commission, no POD, no hire cost for own vehicle
      totalCosts = 0;
      commissionEffect = 0;
      podBalance = 0;
      profitLoss = totalRevenue;
    }
    
    return {
      totalRevenue,
      totalCosts,
      totalAdjustments,
      profitLoss,
      commissionEffect,
      podBalance,
      isFleetOwned
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data
      const submitData = { ...formData };
      
      // Remove driverId if empty (for fleet-owned vehicles)
      if (!submitData.driverId) {
        delete submitData.driverId;
      }
      
      if (editData) {
        await tripAPI.update(editData._id, submitData);
        toast.success('Trip updated successfully!');
      } else {
        await tripAPI.create(submitData);
        toast.success('Trip created successfully!');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save trip');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const filteredDrivers = drivers.filter(d =>
    d.fullName.toLowerCase().includes(driverSearch.toLowerCase()) ||
    d.contact.includes(driverSearch)
  );

  const getFilteredClients = (index) => {
    return clients.filter(c =>
      c.fullName.toLowerCase().includes((clientSearch[index] || '').toLowerCase()) ||
      c.companyName?.toLowerCase().includes((clientSearch[index] || '').toLowerCase())
    );
  };

  const getFilteredCities = (searchTerm) => {
    return cities.filter(c =>
      c.cityName.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      c.state.toLowerCase().includes((searchTerm || '').toLowerCase())
    );
  };

  const calculations = calculateProfitLoss();
  const isFleetOwned = selectedVehicle?.ownershipType === 'fleet_owner';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editData ? 'Edit Trip' : 'Create New Trip'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Trip Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vehicle Selection */}
            <div>
              <label className="label">
                Vehicle <span className="text-red-500">*</span>
              </label>
              <div className="text-xs text-gray-500 mb-1">
                {vehicles.filter(v => v.currentStatus === 'available').length} available, {vehicles.filter(v => v.currentStatus === 'on_trip').length} on trip
              </div>
              <input
                type="text"
                placeholder="Search vehicle..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="input mb-2"
              />
              <select
                value={formData.vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="input"
                required
              >
                <option value="">Select Vehicle</option>
                {filteredVehicles.map((vehicle) => {
                  const isOnTrip = vehicle.currentStatus === 'on_trip';
                  const isCurrentVehicle = editData && vehicle._id === editData.vehicleId?._id;
                  return (
                    <option 
                      key={vehicle._id} 
                      value={vehicle._id}
                      disabled={isOnTrip && !isCurrentVehicle}
                    >
                      {vehicle.vehicleNumber} - {vehicle.vehicleType} 
                      {vehicle.ownershipType === 'self_owned' 
                        ? ' (Own)' 
                        : vehicle.fleetOwnerId 
                          ? ` (${vehicle.fleetOwnerId.fullName})` 
                          : ' (Fleet Owner)'}
                      {isOnTrip && !isCurrentVehicle ? ' - On Trip' : ''}
                    </option>
                  );
                })}
              </select>
              {selectedVehicle && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-medium capitalize">
                    {selectedVehicle.ownershipType.replace('_', ' ')}
                  </span>
                  {selectedVehicle.fleetOwnerId && (
                    <span> - {selectedVehicle.fleetOwnerId.fullName}</span>
                  )}
                </div>
              )}
            </div>

            {/* Driver Selection - Only for Self Owned */}
            {selectedVehicle?.ownershipType === 'self_owned' && (
              <div>
                <label className="label">Driver</label>
                <div className="text-xs text-gray-500 mb-1">
                  {drivers.filter(d => d.status === 'available').length} available, {drivers.filter(d => d.status === 'on_trip').length} on trip
                </div>
                <input
                  type="text"
                  placeholder="Search driver..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="input mb-2"
                />
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="input"
                >
                  <option value="">Select Driver</option>
                  {filteredDrivers.map((driver) => {
                    const isOnTrip = driver.status === 'on_trip' || driver.currentVehicle;
                    const isCurrentDriver = editData && driver._id === editData.driverId?._id;
                    return (
                      <option 
                        key={driver._id} 
                        value={driver._id}
                        disabled={isOnTrip && !isCurrentDriver}
                      >
                        {driver.fullName} - {driver.contact}
                        {isOnTrip && !isCurrentDriver ? ' - On Trip' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Trip Date & Time */}
            <div>
              <label className="label">
                Trip Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.tripDateTime}
                onChange={(e) => setFormData({ ...formData, tripDateTime: e.target.value })}
                className="input"
                required
              />
            </div>

            {/* Load Date */}
            <div>
              <label className="label">
                Load Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.loadDate}
                onChange={(e) => setFormData({ ...formData, loadDate: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* Clients Section */}
        <div className="border-t pt-6">
          {formData.clients.map((client, index) => (
            <div key={index} className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900">Client #{index + 1}</h4>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveClient(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Selection */}
                <div className="md:col-span-2">
                  <label className="label">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search client..."
                    value={clientSearch[index] || ''}
                    onChange={(e) => {
                      const newSearch = [...clientSearch];
                      newSearch[index] = e.target.value;
                      setClientSearch(newSearch);
                    }}
                    className="input mb-2"
                  />
                  <select
                    value={client.clientId}
                    onChange={(e) => handleClientChange(index, 'clientId', e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select Client</option>
                    {getFilteredClients(index).map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.fullName} {c.companyName && `- ${c.companyName}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Origin City */}
                <div>
                  <label className="label">
                    Origin (Pickup) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={originSearch[index] || ''}
                    onChange={(e) => {
                      const newSearch = [...originSearch];
                      newSearch[index] = e.target.value;
                      setOriginSearch(newSearch);
                    }}
                    className="input mb-2"
                  />
                  <select
                    value={client.originCity}
                    onChange={(e) => handleClientChange(index, 'originCity', e.target.value)}
                    className="input mb-2"
                    required
                  >
                    <option value="">Select City</option>
                    {getFilteredCities(originSearch[index]).map((city) => (
                      <option key={city._id} value={city._id}>
                        {city.cityName}, {city.state}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const newShow = [...showAddOrigin];
                      newShow[index] = !newShow[index];
                      setShowAddOrigin(newShow);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showAddOrigin[index] ? '− Cancel' : '+ Add New City'}
                  </button>
                  
                  {showAddOrigin[index] && (
                    <div className="mt-2 p-3 bg-white border rounded space-y-2">
                      <input
                        type="text"
                        placeholder="City Name"
                        value={newCity.cityName}
                        onChange={(e) => setNewCity({...newCity, cityName: e.target.value})}
                        className="input text-sm"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newCity.state}
                        onChange={(e) => setNewCity({...newCity, state: e.target.value})}
                        className="input text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Pincode (optional)"
                        value={newCity.pincode}
                        onChange={(e) => setNewCity({...newCity, pincode: e.target.value})}
                        className="input text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewCity('origin', index)}
                        className="btn btn-primary text-sm w-full"
                      >
                        Save City
                      </button>
                    </div>
                  )}
                </div>

                {/* Destination City */}
                <div>
                  <label className="label">
                    Destination (Drop-off) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={destinationSearch[index] || ''}
                    onChange={(e) => {
                      const newSearch = [...destinationSearch];
                      newSearch[index] = e.target.value;
                      setDestinationSearch(newSearch);
                    }}
                    className="input mb-2"
                  />
                  <select
                    value={client.destinationCity}
                    onChange={(e) => handleClientChange(index, 'destinationCity', e.target.value)}
                    className="input mb-2"
                    required
                  >
                    <option value="">Select City</option>
                    {getFilteredCities(destinationSearch[index]).map((city) => (
                      <option key={city._id} value={city._id}>
                        {city.cityName}, {city.state}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const newShow = [...showAddDestination];
                      newShow[index] = !newShow[index];
                      setShowAddDestination(newShow);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showAddDestination[index] ? '− Cancel' : '+ Add New City'}
                  </button>
                  
                  {showAddDestination[index] && (
                    <div className="mt-2 p-3 bg-white border rounded space-y-2">
                      <input
                        type="text"
                        placeholder="City Name"
                        value={newCity.cityName}
                        onChange={(e) => setNewCity({...newCity, cityName: e.target.value})}
                        className="input text-sm"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newCity.state}
                        onChange={(e) => setNewCity({...newCity, state: e.target.value})}
                        className="input text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Pincode (optional)"
                        value={newCity.pincode}
                        onChange={(e) => setNewCity({...newCity, pincode: e.target.value})}
                        className="input text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewCity('destination', index)}
                        className="btn btn-primary text-sm w-full"
                      >
                        Save City
                      </button>
                    </div>
                  )}
                </div>

                {/* Client Rate */}
                <div>
                  <label className="label">
                    Client Rate (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={client.clientRate}
                    onChange={(e) => handleClientChange(index, 'clientRate', e.target.value)}
                    className="input"
                    placeholder="50000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Amount client will pay</p>
                </div>

                {/* Load Date for this client */}
                <div>
                  <label className="label">
                    Load Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={client.loadDate}
                    onChange={(e) => handleClientChange(index, 'loadDate', e.target.value)}
                    className="input"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">When to load this client's goods</p>
                </div>

                {/* Truck Hire Cost - Only for Fleet Owned */}
                {isFleetOwned && (
                  <div>
                    <label className="label">
                      Truck Hire Cost (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={client.truckHireCost}
                      onChange={(e) => handleClientChange(index, 'truckHireCost', e.target.value)}
                      className="input"
                      placeholder="42005"
                      required={isFleetOwned}
                    />
                    <p className="text-xs text-gray-500 mt-1">Cost to hire this truck</p>
                  </div>
                )}

                {/* Adjustment */}
                <div>
                  <label className="label">Adjustment (₹)</label>
                  <input
                    type="number"
                    value={client.adjustment}
                    onChange={(e) => handleClientChange(index, 'adjustment', e.target.value)}
                    className="input"
                    placeholder="2000"
                  />
                </div>

                {/* Packaging Type */}
                <div>
                  <label className="label">Packaging Type</label>
                  <select
                    value={client.packagingType}
                    onChange={(e) => handleClientChange(index, 'packagingType', e.target.value)}
                    className="input"
                  >
                    <option value="boxes">Boxes</option>
                    <option value="pallets">Pallets</option>
                    <option value="loose">Loose</option>
                    <option value="container">Container</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Special Instructions */}
                <div className="md:col-span-2">
                  <label className="label">Special Instructions</label>
                  <textarea
                    value={client.specialInstructions}
                    onChange={(e) => handleClientChange(index, 'specialInstructions', e.target.value)}
                    className="input"
                    rows="2"
                    placeholder="Any special handling instructions"
                  ></textarea>
                </div>
              </div>
            </div>
          ))}

          {/* Add Another Client Button */}
          <button
            type="button"
            onClick={handleAddClient}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Another Client</span>
          </button>
        </div>

        {/* Overall Trip Details - Only for Fleet Owned */}
        {isFleetOwned && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Fleet Owner Payment Details</h3>
            <p className="text-sm text-gray-600 mb-4">Commission and POD balance for fleet owner</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Overall Trip Rate - Auto calculated from truck hire costs */}
              <div>
                <label className="label">Overall Trip Rate (₹)</label>
                <input
                  type="number"
                  value={formData.clients.reduce((sum, c) => sum + (parseFloat(c.truckHireCost) || 0), 0)}
                  className="input bg-gray-100"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated from truck hire costs</p>
              </div>

              {/* Commission Type */}
              <div>
                <label className="label">Commission Type</label>
                <select
                  value={formData.commissionType}
                  onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                  className="input"
                >
                  <option value="none">No Commission</option>
                  <option value="from_fleet_owner">Commission From Fleet Owner (+ Profit)</option>
                  {/* <option value="to_fleet_owner">Commission To Fleet Owner (- Profit)</option> */}
                </select>
              </div>

              {/* Commission Amount */}
              {formData.commissionType !== 'none' && (
                <div>
                  <label className="label">
                    Commission Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.commissionAmount}
                    onChange={(e) => setFormData({ ...formData, commissionAmount: e.target.value })}
                    className="input"
                    placeholder="2000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.commissionType === 'from_fleet_owner' 
                      ? 'Fleet owner will give you this amount (adds to profit)' 
                      : 'You will give fleet owner this amount (reduces profit)'}
                  </p>
                </div>
              )}

              {/* POD Balance */}
              <div>
                <label className="label">POD Balance (₹)</label>
                <input
                  type="number"
                  value={formData.podBalance}
                  onChange={(e) => setFormData({ ...formData, podBalance: e.target.value })}
                  className="input"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Amount to pay fleet owner after POD</p>
              </div>
            </div>
          </div>
        )}

        {/* Profit & Loss Calculation */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
            📊 Profit & Loss Calculation
          </h3>
          
          {/* Individual Client Breakdown */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Individual Client Profit/Loss Breakdown:</p>
            {formData.clients.map((client, index) => {
              const clientRevenue = parseFloat(client.clientRate) || 0;
              const hireCost = parseFloat(client.truckHireCost) || 0;
              const adjustment = parseFloat(client.adjustment) || 0;
              // Adjustment is NOT included in profit calculation
              const clientProfit = clientRevenue - hireCost;
              
              return (
                <div key={index} className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Client #{index + 1}:</span> 
                  <span className="ml-2">Rate: ₹{clientRevenue.toLocaleString('en-IN')}</span>
                  {isFleetOwned && <span className="ml-2">Hire Cost: ₹{hireCost.toLocaleString('en-IN')}</span>}
                  <span className="ml-2">Adjustment: ₹{adjustment.toLocaleString('en-IN')}</span>
                  <span className="ml-2">Pending Amt: ₹{formData.podBalance || 0}</span>
                  <span className={`ml-2 font-semibold ${clientProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {clientProfit >= 0 ? '+' : ''}₹{clientProfit.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 mb-1">Total Client Revenue</p>
              <p className="text-2xl font-bold text-green-700">₹{calculations.totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 mb-1">
                {calculations.isFleetOwned ? 'Hire Cost' : 'No Costs'}
              </p>
              <p className="text-2xl font-bold text-red-700">
                ₹{calculations.totalCosts.toLocaleString('en-IN')}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${
              calculations.profitLoss >= 0 
                ? 'bg-blue-50 border-blue-500' 
                : 'bg-orange-50 border-orange-500'
            }`}>
              <p className="text-xs text-gray-600 mb-1">Overall Trip Profit/Loss</p>
              <p className={`text-2xl font-bold ${
                calculations.profitLoss >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                {calculations.profitLoss >= 0 ? '+' : ''}₹{calculations.profitLoss.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <p className="text-yellow-800">
              <strong>Calculation Formula ({calculations.isFleetOwned ? 'Fleet-Owned' : 'Self-Owned'}):</strong><br/>
              {calculations.isFleetOwned ? (
                <>
                  Profit = Client Revenue (₹{calculations.totalRevenue.toLocaleString('en-IN')}) 
                  - Fleet Hire Cost (₹{calculations.totalCosts.toLocaleString('en-IN')})
                  {calculations.commissionEffect !== 0 && (
                    calculations.commissionEffect > 0 
                      ? ` + Commission Received (₹${Math.abs(calculations.commissionEffect).toLocaleString('en-IN')})`
                      : ` - Commission Paid (₹${Math.abs(calculations.commissionEffect).toLocaleString('en-IN')})`
                  )}
                  {calculations.podBalance !== 0 && ` + POD Balance (₹${calculations.podBalance.toLocaleString('en-IN')})`}
                  {` = ${calculations.profitLoss >= 0 ? 'Profit' : 'Loss'} ₹${Math.abs(calculations.profitLoss).toLocaleString('en-IN')}`}
                  <br/>
                  <span className="text-xs text-gray-600">Note: Adjustments (₹{calculations.totalAdjustments.toLocaleString('en-IN')}) are tracked separately and not included in profit calculation</span>
                </>
              ) : (
                <>
                  Profit = Client Revenue (₹{calculations.totalRevenue.toLocaleString('en-IN')})
                  {` = ${calculations.profitLoss >= 0 ? 'Profit' : 'Loss'} ₹${Math.abs(calculations.profitLoss).toLocaleString('en-IN')}`}
                  <br/>
                  <span className="text-xs text-gray-600">Note: Adjustments (₹{calculations.totalAdjustments.toLocaleString('en-IN')}) are tracked separately and not included in profit calculation</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Additional Information</h3>
          <div>
            <label className="label">Special Instructions</label>
            <textarea
              value={formData.additionalInstructions}
              onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
              className="input"
              rows="3"
              placeholder="Any additional instructions for this trip"
            ></textarea>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
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
            <span>{editData ? 'Update Trip' : 'Create Trip'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
