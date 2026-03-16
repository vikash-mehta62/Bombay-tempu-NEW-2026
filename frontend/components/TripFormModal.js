'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import DriverFormModal from './DriverFormModal';
import ClientFormModal from './ClientFormModal';
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
  
  // Dropdown visibility states
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [showAddClient, setShowAddClient] = useState([]);
  const [showAddOrigin, setShowAddOrigin] = useState([]);
  const [showAddDestination, setShowAddDestination] = useState([]);
  
  // Modal states for adding new entities
  const [showDriverFormModal, setShowDriverFormModal] = useState(false);
  const [showClientFormModal, setShowClientFormModal] = useState(false);
  const [showCityFormModal, setShowCityFormModal] = useState(false);
  const [currentClientIndex, setCurrentClientIndex] = useState(null);
  const [currentCityType, setCurrentCityType] = useState(null); // 'origin' or 'destination'
  const [currentCityIndex, setCurrentCityIndex] = useState(null);
  
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
        
        // Set selected vehicle and vehicle search
        if (editData.vehicleId) {
          setSelectedVehicle(editData.vehicleId);
          setVehicleSearch(editData.vehicleId.vehicleNumber || '');
        }
        
        // Set driver search if driver exists
        if (editData.driverId) {
          setDriverSearch(editData.driverId.fullName || '');
        }
        
        // Initialize search arrays for clients with actual names
        if (editData.clients) {
          const clientSearchArray = editData.clients.map(client => 
            client.clientId?.fullName || ''
          );
          const originSearchArray = editData.clients.map(client => 
            client.originCity ? `${client.originCity.cityName}, ${client.originCity.state}` : ''
          );
          const destinationSearchArray = editData.clients.map(client => 
            client.destinationCity ? `${client.destinationCity.cityName}, ${client.destinationCity.state}` : ''
          );
          
          setClientSearch(clientSearchArray);
          setOriginSearch(originSearchArray);
          setDestinationSearch(destinationSearchArray);
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
        setVehicleSearch('');
        setDriverSearch('');
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
        clientAPI.getAll({all:"all"}),
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
    
    // Auto-select default driver if vehicle is self-owned and has a default driver
    let defaultDriverId = '';
    if (vehicle?.ownershipType === 'self_owned' && vehicle?.defaultDriverId) {
      defaultDriverId = vehicle.defaultDriverId._id || vehicle.defaultDriverId;
      
      // Update driver search field with default driver name
      const defaultDriver = drivers.find(d => d._id === defaultDriverId);
      if (defaultDriver) {
        setDriverSearch(defaultDriver.fullName);
      }
    }
    
    setFormData({ ...formData, vehicleId, driverId: defaultDriverId });
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

  const handleAddNewCity = async () => {
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
      if (currentCityType === 'origin' && currentCityIndex !== null) {
        handleClientChange(currentCityIndex, 'originCity', response.data.data._id);
        const newSearch = [...originSearch];
        newSearch[currentCityIndex] = `${response.data.data.cityName}, ${response.data.data.state}`;
        setOriginSearch(newSearch);
      } else if (currentCityType === 'destination' && currentCityIndex !== null) {
        handleClientChange(currentCityIndex, 'destinationCity', response.data.data._id);
        const newSearch = [...destinationSearch];
        newSearch[currentCityIndex] = `${response.data.data.cityName}, ${response.data.data.state}`;
        setDestinationSearch(newSearch);
      }
      
      // Reset form and close modal
      setNewCity({ cityName: '', state: '', pincode: '' });
      setShowCityFormModal(false);
      setCurrentCityType(null);
      setCurrentCityIndex(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add city');
    }
  };

  const handleDriverSuccess = async () => {
    // Reload drivers
    const driversRes = await driverAPI.getAll();
    setDrivers(driversRes.data.data);
    setShowDriverFormModal(false);
  };

  const handleClientSuccess = async () => {
    // Reload clients
    const clientsRes = await clientAPI.getAll();
    setClients(clientsRes.data.data);
    setShowClientFormModal(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any dropdown
      const isOutsideDropdown = !event.target.closest('.dropdown-container');
      
      if (isOutsideDropdown) {
        setShowVehicleDropdown(false);
        setShowDriverDropdown(false);
        setShowAddClient(showAddClient.map(() => false));
        setShowAddOrigin(showAddOrigin.map(() => false));
        setShowAddDestination(showAddDestination.map(() => false));
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, showAddClient, showAddOrigin, showAddDestination]);

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

  const getFilteredOriginCities = (index) => {
    const searchTerm = originSearch[index] || '';
    const currentClient = formData.clients[index];
    
    // Get all selected cities (origin and destination) from all clients
    const selectedCities = formData.clients.reduce((acc, client, idx) => {
      // For current client, only exclude destination
      if (idx === index) {
        if (client.destinationCity) acc.push(client.destinationCity);
      } else {
        // For other clients, exclude both origin and destination
        if (client.originCity) acc.push(client.originCity);
        if (client.destinationCity) acc.push(client.destinationCity);
      }
      return acc;
    }, []);
    
    return cities.filter(c =>
      (c.cityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       c.state.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !selectedCities.includes(c._id)
    );
  };

  const getFilteredDestinationCities = (index) => {
    const searchTerm = destinationSearch[index] || '';
    const currentClient = formData.clients[index];
    
    // Get all selected cities (origin and destination) from all clients
    const selectedCities = formData.clients.reduce((acc, client, idx) => {
      // For current client, only exclude origin
      if (idx === index) {
        if (client.originCity) acc.push(client.originCity);
      } else {
        // For other clients, exclude both origin and destination
        if (client.originCity) acc.push(client.originCity);
        if (client.destinationCity) acc.push(client.destinationCity);
      }
      return acc;
    }, []);
    
    return cities.filter(c =>
      (c.cityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       c.state.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !selectedCities.includes(c._id)
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
              <div className="relative dropdown-container">
                <input
                  type="text"
                  placeholder="Search and select vehicle..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  onFocus={() => setShowVehicleDropdown(true)}
                  className="input"
                />
                {showVehicleDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map((vehicle) => {
                        const isOnTrip = vehicle.currentStatus === 'on_trip';
                        const isCurrentVehicle = editData && vehicle._id === editData.vehicleId?._id;
                        const isDisabled = isOnTrip && !isCurrentVehicle;
                        return (
                          <div
                            key={vehicle._id}
                            onClick={() => {
                              if (!isDisabled) {
                                handleVehicleChange(vehicle._id);
                                setVehicleSearch(vehicle.vehicleNumber);
                                setShowVehicleDropdown(false);
                              }
                            }}
                            className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            } ${formData.vehicleId === vehicle._id ? 'bg-blue-100' : ''}`}
                          >
                            <div className="font-medium">{vehicle.vehicleNumber} - {vehicle.vehicleType}</div>
                            <div className="text-xs text-gray-600">
                              {vehicle.ownershipType === 'self_owned' 
                                ? 'Own Vehicle' 
                                : vehicle.fleetOwnerId 
                                  ? `Fleet: ${vehicle.fleetOwnerId.fullName}` 
                                  : 'Fleet Owner'}
                              {isOnTrip && !isCurrentVehicle ? ' - On Trip' : ''}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">No vehicles found</div>
                    )}
                  </div>
                )}
              </div>
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
                <div className="relative dropdown-container">
                  <input
                    type="text"
                    placeholder="Search and select driver..."
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    onFocus={() => setShowDriverDropdown(true)}
                    className="input"
                  />
                  {showDriverDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div
                        onClick={() => {
                          setShowDriverFormModal(true);
                          setShowDriverDropdown(false);
                        }}
                        className="px-4 py-2 cursor-pointer hover:bg-green-50 border-b border-gray-200 text-green-600 font-medium flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Driver</span>
                      </div>
                      {filteredDrivers.length > 0 ? (
                        filteredDrivers.map((driver) => {
                          const isOnTrip = driver.status === 'on_trip' || driver.currentVehicle;
                          const isCurrentDriver = editData && driver._id === editData.driverId?._id;
                          const isDisabled = isOnTrip && !isCurrentDriver;
                          return (
                            <div
                              key={driver._id}
                              onClick={() => {
                                if (!isDisabled) {
                                  setFormData({ ...formData, driverId: driver._id });
                                  setDriverSearch(driver.fullName);
                                  setShowDriverDropdown(false);
                                }
                              }}
                              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                              } ${formData.driverId === driver._id ? 'bg-blue-100' : ''}`}
                            >
                              <div className="font-medium">{driver.fullName}</div>
                              <div className="text-xs text-gray-600">
                                {driver.contact}
                                {isOnTrip && !isCurrentDriver ? ' - On Trip' : ''}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">No drivers found</div>
                      )}
                    </div>
                  )}
                </div>
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
                  <div className="relative dropdown-container">
                    <input
                      type="text"
                      placeholder="Search and select client..."
                      value={clientSearch[index] || ''}
                      onChange={(e) => {
                        const newSearch = [...clientSearch];
                        newSearch[index] = e.target.value;
                        setClientSearch(newSearch);
                      }}
                      onFocus={() => {
                        const newShow = [...showAddClient];
                        newShow[index] = true;
                        setShowAddClient(newShow);
                      }}
                      className="input"
                    />
                    {showAddClient[index] && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div
                          onClick={() => {
                            setShowClientFormModal(true);
                            setCurrentClientIndex(index);
                            const newShow = [...showAddClient];
                            newShow[index] = false;
                            setShowAddClient(newShow);
                          }}
                          className="px-4 py-2 cursor-pointer hover:bg-green-50 border-b border-gray-200 text-green-600 font-medium flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add New Client</span>
                        </div>
                        {getFilteredClients(index).length > 0 ? (
                          getFilteredClients(index).map((c) => (
                            <div
                              key={c._id}
                              onClick={() => {
                                handleClientChange(index, 'clientId', c._id);
                                const newSearch = [...clientSearch];
                                newSearch[index] = c.fullName;
                                setClientSearch(newSearch);
                                const newShow = [...showAddClient];
                                newShow[index] = false;
                                setShowAddClient(newShow);
                              }}
                              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                client.clientId === c._id ? 'bg-blue-100' : ''
                              }`}
                            >
                              <div className="font-medium">{c.fullName}</div>
                              {c.companyName && (
                                <div className="text-xs text-gray-600">{c.companyName}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">No clients found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Origin City */}
                <div>
                  <label className="label">
                    Origin (Pickup) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative dropdown-container">
                    <input
                      type="text"
                      placeholder="Search and select origin city..."
                      value={originSearch[index] || ''}
                      onChange={(e) => {
                        const newSearch = [...originSearch];
                        newSearch[index] = e.target.value;
                        setOriginSearch(newSearch);
                      }}
                      onFocus={() => {
                        const newShow = [...showAddOrigin];
                        newShow[index] = true;
                        setShowAddOrigin(newShow);
                      }}
                      className="input"
                    />
                    {showAddOrigin[index] && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div
                          onClick={() => {
                            setShowCityFormModal(true);
                            setCurrentCityType('origin');
                            setCurrentCityIndex(index);
                            const newShow = [...showAddOrigin];
                            newShow[index] = false;
                            setShowAddOrigin(newShow);
                          }}
                          className="px-4 py-2 cursor-pointer hover:bg-green-50 border-b border-gray-200 text-green-600 font-medium flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add New City</span>
                        </div>
                        {getFilteredOriginCities(index).length > 0 ? (
                          getFilteredOriginCities(index).map((city) => (
                            <div
                              key={city._id}
                              onClick={() => {
                                handleClientChange(index, 'originCity', city._id);
                                const newSearch = [...originSearch];
                                newSearch[index] = `${city.cityName}, ${city.state}`;
                                setOriginSearch(newSearch);
                                const newShow = [...showAddOrigin];
                                newShow[index] = false;
                                setShowAddOrigin(newShow);
                              }}
                              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                client.originCity === city._id ? 'bg-blue-100' : ''
                              }`}
                            >
                              <div className="font-medium">{city.cityName}, {city.state}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">No cities found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Destination City */}
                <div>
                  <label className="label">
                    Destination (Drop-off) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative dropdown-container">
                    <input
                      type="text"
                      placeholder="Search and select destination city..."
                      value={destinationSearch[index] || ''}
                      onChange={(e) => {
                        const newSearch = [...destinationSearch];
                        newSearch[index] = e.target.value;
                        setDestinationSearch(newSearch);
                      }}
                      onFocus={() => {
                        const newShow = [...showAddDestination];
                        newShow[index] = true;
                        setShowAddDestination(newShow);
                      }}
                      className="input"
                    />
                    {showAddDestination[index] && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div
                          onClick={() => {
                            setShowCityFormModal(true);
                            setCurrentCityType('destination');
                            setCurrentCityIndex(index);
                            const newShow = [...showAddDestination];
                            newShow[index] = false;
                            setShowAddDestination(newShow);
                          }}
                          className="px-4 py-2 cursor-pointer hover:bg-green-50 border-b border-gray-200 text-green-600 font-medium flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add New City</span>
                        </div>
                        {getFilteredDestinationCities(index).length > 0 ? (
                          getFilteredDestinationCities(index).map((city) => (
                            <div
                              key={city._id}
                              onClick={() => {
                                handleClientChange(index, 'destinationCity', city._id);
                                const newSearch = [...destinationSearch];
                                newSearch[index] = `${city.cityName}, ${city.state}`;
                                setDestinationSearch(newSearch);
                                const newShow = [...showAddDestination];
                                newShow[index] = false;
                                setShowAddDestination(newShow);
                              }}
                              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                client.destinationCity === city._id ? 'bg-blue-100' : ''
                              }`}
                            >
                              <div className="font-medium">{city.cityName}, {city.state}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">No cities found</div>
                        )}
                      </div>
                    )}
                  </div>
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

      {/* Driver Form Modal */}
      <DriverFormModal
        isOpen={showDriverFormModal}
        onClose={() => setShowDriverFormModal(false)}
        onSuccess={handleDriverSuccess}
      />

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={showClientFormModal}
        onClose={() => setShowClientFormModal(false)}
        onSuccess={handleClientSuccess}
      />

      {/* City Form Modal */}
      {showCityFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New City</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  City Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter city name"
                  value={newCity.cityName}
                  onChange={(e) => setNewCity({...newCity, cityName: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="label">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter state"
                  value={newCity.state}
                  onChange={(e) => setNewCity({...newCity, state: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Pincode (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={newCity.pincode}
                  onChange={(e) => setNewCity({...newCity, pincode: e.target.value})}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCityFormModal(false);
                  setNewCity({ cityName: '', state: '', pincode: '' });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewCity}
                className="btn btn-primary"
              >
                Add City
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
