'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Loader,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { tripAPI, tripAdvanceAPI, tripExpenseAPI } from '@/lib/api';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

export default function FleetOwnerViewModal({ fleetOwner, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [advances, setAdvances] = useState({});
  const [expenses, setExpenses] = useState({});
  const [activeTab, setActiveTab] = useState('trips');
  
  // Filters
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalHire: 0,
    totalExpenses: 0,
    advancesPaid: 0,
    pendingAmount: 0,
    totalPOD: 0,
    podPending: 0,
    totalCommission: 0,
    totalTrips: 0
  });

  const [allAdvances, setAllAdvances] = useState([]);

  useEffect(() => {
    if (fleetOwner && isOpen) {
      loadFleetOwnerData();
    }
  }, [fleetOwner, isOpen]);

  const loadFleetOwnerData = async () => {
    try {
      setLoading(true);
      
      // Fetch all trips
      const tripsResponse = await tripAPI.getAll();
      const allTrips = tripsResponse.data.data;
      
      // Filter trips for this fleet owner
      const fleetOwnerTrips = allTrips.filter(trip => 
        trip.vehicleId?.fleetOwnerId?._id === fleetOwner._id && 
        trip.vehicleId?.ownershipType === 'fleet_owner' &&
        trip.isActive
      );
      
      // Fetch advances for each trip
      const advancesData = {};
      const expensesData = {};
      const advancesList = [];
      let totalHire = 0;
      let totalExpenses = 0;
      let totalCommission = 0;
      let advancesPaid = 0;
      let totalPOD = 0;
      let podPending = 0;
      
      for (const trip of fleetOwnerTrips) {
        try {
          const advanceResponse = await tripAdvanceAPI.getByTrip(trip._id);
          const tripAdvances = advanceResponse.data.data || [];
          advancesData[trip._id] = tripAdvances;
          
          // Fetch trip expenses
          const expensesResponse = await tripExpenseAPI.getByTrip(trip._id);
          const tripExpenses = expensesResponse.data.data || [];
          expensesData[trip._id] = tripExpenses;
          
          // Add trip info to each advance for display
          tripAdvances.forEach(adv => {
            advancesList.push({
              ...adv,
              tripNumber: trip.tripNumber,
              vehicleNumber: trip.vehicleId?.vehicleNumber,
              loadDate: trip.loadDate
            });
          });
          
          const tripAdvanceTotal = tripAdvances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
          advancesPaid += tripAdvanceTotal;
          
          // Calculate trip amount (hire cost)
          const hireTotal = trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;
          totalHire += hireTotal;
          
          const expensesTotal = tripExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
          totalExpenses += expensesTotal;
          
          // Get commission
          const commission = trip.commissionAmount || 0;
          // If commission is from fleet owner, it's income (+), if to fleet owner, it's expense (-)
          if (trip.commissionType === 'from_fleet_owner') {
            totalCommission += commission; // This reduces what we owe to fleet owner
          } else if (trip.commissionType === 'to_fleet_owner') {
            totalCommission -= commission; // This increases what we owe to fleet owner
          }
          
          totalPOD += (trip.podBalance || 0);
          
        } catch (error) {
          advancesData[trip._id] = [];
          expensesData[trip._id] = [];
        }
      }
      
      // Formula: (Hire + Expenses) - Commission - POD - Advances
      const totalAmount = totalHire + totalExpenses;
      podPending = totalPOD;
      const pendingAmount = totalAmount - totalCommission - totalPOD - advancesPaid;
      
      setTrips(fleetOwnerTrips);
      setAdvances(advancesData);
      setExpenses(expensesData);
      setAllAdvances(advancesList);
      setStats({
        totalAmount,
        totalHire,
        totalExpenses,
        advancesPaid,
        pendingAmount,
        totalPOD,
        podPending,
        totalCommission,
        totalTrips: fleetOwnerTrips.length
      });
      
    } catch (error) {
      console.error('Error loading fleet owner data:', error);
      toast.error('Failed to load fleet owner data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFilteredTrips = () => {
    let filtered = [...trips];
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(trip => trip.status === filterType);
    }
    
    // Filter by search (trip number)
    if (searchTerm) {
      filtered = filtered.filter(trip => 
        trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by vehicle number
    if (vehicleSearch) {
      filtered = filtered.filter(trip => 
        trip.vehicleId?.vehicleNumber?.toLowerCase().includes(vehicleSearch.toLowerCase())
      );
    }
    
    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(trip => new Date(trip.loadDate) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(trip => new Date(trip.loadDate) <= new Date(endDate));
    }
    
    return filtered;
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('fleet-owner-statement');
      if (!element) {
        toast.error('Statement element not found');
        return;
      }

      toast.loading('Generating PDF...');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Fleet_Owner_Statement_${fleetOwner.fullName}_${new Date().toLocaleDateString('en-IN')}.png`;
      link.href = imgData;
      link.click();
      
      toast.dismiss();
      toast.success('Statement downloaded successfully');
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.dismiss();
      toast.error('Failed to export statement');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Fleet Owner Statement - ${fleetOwner.fullName}`} size="xl">
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Name:</p>
              <p className="font-semibold text-gray-900">{fleetOwner.fullName}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone:</p>
              <p className="font-semibold text-gray-900">{fleetOwner.contact}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Advances:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(stats.advancesPaid)}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">Total Hire</p>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(stats.totalHire)}</p>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-600 mb-1">Total Expenses</p>
            <p className="text-lg font-bold text-yellow-900">{formatCurrency(stats.totalExpenses)}</p>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
            <p className="text-xs text-indigo-600 mb-1">Commission</p>
            <p className="text-lg font-bold text-indigo-900">{formatCurrency(stats.totalCommission)}</p>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-600 mb-1">Total POD</p>
            <p className="text-lg font-bold text-purple-900">{formatCurrency(stats.totalPOD)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 mb-1">Advances Paid</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(stats.advancesPaid)}</p>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-600 mb-1">POD Pending</p>
            <p className="text-lg font-bold text-orange-900">{formatCurrency(stats.podPending)}</p>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-xs text-red-600 mb-1">Pending Amount</p>
            <p className="text-lg font-bold text-red-900">{formatCurrency(stats.pendingAmount)}</p>
            <p className="text-xs text-gray-600 mt-1">(Hire+Exp) - Comm - POD - Adv</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('trips')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'trips'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Trip Details
            </button>
            <button
              onClick={() => setActiveTab('pods')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'pods'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              POD Statement
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'advances'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Advances ({allAdvances.length})
            </button>
          </div>
        </div>

        {/* Trip Details Tab */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : getFilteredTrips().length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No trips found</p>
              </div>
            ) : (
              getFilteredTrips().map((trip) => {
                const tripAdvances = advances[trip._id] || [];
                const tripExpenses = expenses[trip._id] || [];
                const advanceTotal = tripAdvances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
                const hireTotal = trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;
                const expensesTotal = tripExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                
                // Commission calculation
                let commission = trip.commissionAmount || 0;
                if (trip.commissionType === 'to_fleet_owner') {
                  commission = -commission; // Negative means we owe more to fleet owner
                }
                
                const podBalance = trip.podBalance || 0;
                
                // Formula: (Hire + Expenses) - Commission - POD - Advances
                const pending = (hireTotal + expensesTotal) - commission - podBalance - advanceTotal;
                
                return (
                  <div key={trip._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <a 
                            href={`/trip/${trip._id}`}
                            className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/trip/${trip._id}`;
                            }}
                          >
                            {trip.tripNumber}
                          </a>
                          <p className="text-sm text-gray-600">{trip.vehicleId?.vehicleNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Load Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(trip.loadDate)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-6 gap-2 mb-3">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Hire Cost</p>
                        <p className="font-bold text-gray-900">{formatCurrency(hireTotal)}</p>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <p className="text-xs text-yellow-600">Expenses</p>
                        <p className="font-bold text-yellow-700">{formatCurrency(expensesTotal)}</p>
                      </div>
                      <div className={`p-2 rounded ${trip.commissionType === 'from_fleet_owner' ? 'bg-green-50' : trip.commissionType === 'to_fleet_owner' ? 'bg-red-50' : 'bg-blue-50'}`}>
                        <p className={`text-xs ${trip.commissionType === 'from_fleet_owner' ? 'text-green-600' : trip.commissionType === 'to_fleet_owner' ? 'text-red-600' : 'text-blue-600'}`}>
                          Commission {trip.commissionType === 'from_fleet_owner' ? '(From)' : trip.commissionType === 'to_fleet_owner' ? '(To)' : ''}
                        </p>
                        <p className={`font-bold ${trip.commissionType === 'from_fleet_owner' ? 'text-green-700' : trip.commissionType === 'to_fleet_owner' ? 'text-red-700' : 'text-blue-700'}`}>
                          {formatCurrency(Math.abs(commission))}
                        </p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-green-600">Advances</p>
                        <p className="font-bold text-green-700">{formatCurrency(advanceTotal)}</p>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <p className="text-xs text-purple-600">POD Balance</p>
                        <p className="font-bold text-purple-700">{formatCurrency(podBalance)}</p>
                      </div>
                      <div className={`p-2 rounded ${pending > 0 ? 'bg-red-50' : pending < 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${pending > 0 ? 'text-red-600' : pending < 0 ? 'text-green-600' : 'text-gray-600'}`}>Pending</p>
                        <p className={`font-bold ${pending > 0 ? 'text-red-700' : pending < 0 ? 'text-green-700' : 'text-gray-700'}`}>{formatCurrency(pending)}</p>
                      </div>
                    </div>
                    
                    {tripAdvances.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Advance History:</p>
                        <div className="space-y-1">
                          {tripAdvances.map((adv) => (
                            <div key={adv._id} className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                              <span className="text-gray-700">{formatDate(adv.createdAt)}</span>
                              <span className="font-semibold text-green-700">{formatCurrency(adv.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* POD Statement Tab */}
        {activeTab === 'pods' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">POD Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">Total POD</p>
                  <p className="text-xl font-bold text-purple-900">{formatCurrency(stats.totalPOD)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">POD Given</p>
                  <p className="text-xl font-bold text-green-900">{formatCurrency(0)}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-600 mb-1">POD Pending</p>
                  <p className="text-xl font-bold text-orange-900">{formatCurrency(stats.podPending)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Trip-wise POD Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">TRIP NUMBER</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">VEHICLE</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">DATE</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">TOTAL POD</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">POD GIVEN</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">POD REMAINING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center">
                          <Loader className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                        </td>
                      </tr>
                    ) : getFilteredTrips().length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          No trips found
                        </td>
                      </tr>
                    ) : (
                      getFilteredTrips().map((trip) => {
                        const podGiven = 0; // You can add POD given tracking here
                        const podRemaining = trip.podBalance - podGiven;
                        
                        return (
                          <tr key={trip._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">
                              <a 
                                href={`/trip/${trip._id}`}
                                className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.location.href = `/trip/${trip._id}`;
                                }}
                              >
                                {trip.tripNumber}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{trip.vehicleId?.vehicleNumber}</td>
                            <td className="px-4 py-3 text-gray-600">{formatDate(trip.loadDate)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-purple-600">{formatCurrency(trip.podBalance)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(podGiven)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-orange-600">{formatCurrency(podRemaining)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Advances Tab */}
        {activeTab === 'advances' && (
          <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6" />
                <h3 className="font-bold text-xl">Trips Statement ({getFilteredTrips().length} Trips)</h3>
              </div>
              <button
                onClick={exportToPDF}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Trip Number</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Vehicle Number<br/>(गाड़ी नंबर)</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Trip/Load Date</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">POD Balance</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">Fleet Advances</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                        <p className="text-gray-600 mt-2">Loading trips...</p>
                      </td>
                    </tr>
                  ) : getFilteredTrips().length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-lg font-semibold">No trips found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  ) : (
                    getFilteredTrips().map((trip, index) => {
                      const tripAdvances = advances[trip._id] || [];
                      const advanceTotal = tripAdvances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
                      const hireTotal = trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;
                      const pending = hireTotal - advanceTotal;
                      
                      return (
                        <tr key={trip._id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-gray-700 font-semibold">{index + 1}</td>
                          <td className="px-6 py-4">
                            <a 
                              href={`/trip/${trip._id}`}
                              className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer text-base"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/trip/${trip._id}`;
                              }}
                            >
                              {trip.tripNumber}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900 text-base">{trip.vehicleId?.vehicleNumber || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{formatDate(trip.loadDate)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              trip.status === 'completed' ? 'bg-green-100 text-green-700' :
                              trip.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {trip.status === 'completed' ? 'Completed' :
                               trip.status === 'in_progress' ? 'In Progress' :
                               'Scheduled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-gray-900 text-base">{formatCurrency(hireTotal)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold text-purple-600">{formatCurrency(trip.podBalance)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-green-600 text-base">{formatCurrency(advanceTotal)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-bold text-base ${pending > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                              {formatCurrency(pending)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {getFilteredTrips().length > 0 && (
                  <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-4 border-gray-400">
                    <tr>
                      <td colSpan="5" className="px-6 py-5 text-right">
                        <span className="font-bold text-gray-900 text-lg uppercase">TOTAL:</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-gray-900 text-lg">
                          {formatCurrency(getFilteredTrips().reduce((sum, trip) => {
                            const hireTotal = trip.clients?.reduce((s, c) => s + (c.truckHireCost || 0), 0) || 0;
                            return sum + hireTotal;
                          }, 0))}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-purple-700 text-lg">
                          {formatCurrency(getFilteredTrips().reduce((sum, trip) => sum + (trip.podBalance || 0), 0))}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-green-700 text-lg">
                          {formatCurrency(getFilteredTrips().reduce((sum, trip) => {
                            const tripAdvances = advances[trip._id] || [];
                            return sum + tripAdvances.reduce((s, adv) => s + (adv.amount || 0), 0);
                          }, 0))}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-red-700 text-lg">
                          {formatCurrency(getFilteredTrips().reduce((sum, trip) => {
                            const tripAdvances = advances[trip._id] || [];
                            const advanceTotal = tripAdvances.reduce((s, adv) => s + (adv.amount || 0), 0);
                            const hireTotal = trip.clients?.reduce((s, c) => s + (c.truckHireCost || 0), 0) || 0;
                            return sum + (hireTotal - advanceTotal);
                          }, 0))}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Tab Content - Advances */}
        {activeTab === 'advances' && (
          <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6" />
                <h3 className="font-bold text-xl">All Advances ({allAdvances.length})</h3>
              </div>
              <div className="bg-white text-green-600 px-4 py-2 rounded-lg font-bold text-lg">
                Total: {formatCurrency(allAdvances.reduce((sum, adv) => sum + (adv.amount || 0), 0))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Trip Number</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Vehicle Number<br/>(गाड़ी नंबर)</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto" />
                        <p className="text-gray-600 mt-2">Loading advances...</p>
                      </td>
                    </tr>
                  ) : allAdvances.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-lg font-semibold">No advances found</p>
                        <p className="text-gray-400 text-sm mt-1">No advance payments have been made yet</p>
                      </td>
                    </tr>
                  ) : (
                    allAdvances
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((advance, index) => (
                        <tr key={advance._id} className="hover:bg-green-50 transition-colors">
                          <td className="px-6 py-4 text-gray-700 font-semibold">{index + 1}</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">
                            {formatDate(advance.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <a 
                              href={`/trip/${advance.tripId}`}
                              className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer text-base"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/trip/${advance.tripId}`;
                              }}
                            >
                              {advance.tripNumber}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900 text-base">{advance.vehicleNumber}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-green-600 text-lg">{formatCurrency(advance.amount)}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {advance.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">
                            {advance.createdBy?.fullName || 'N/A'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
                {allAdvances.length > 0 && (
                  <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-4 border-gray-400">
                    <tr>
                      <td colSpan="4" className="px-6 py-5 text-right">
                        <span className="font-bold text-gray-900 text-lg uppercase">TOTAL ADVANCES:</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-green-700 text-xl">
                          {formatCurrency(allAdvances.reduce((sum, adv) => sum + (adv.amount || 0), 0))}
                        </span>
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Hidden Statement Content for Export */}
        <div id="fleet-owner-statement" className="hidden">
          <div className="bg-white p-8">
            {/* Header */}
            <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Fleet Owner Statement</h1>
              <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>

            {/* Basic Information */}
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">Fleet Owner Information</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Name:</p>
                  <p className="font-semibold text-gray-900">{fleetOwner.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Phone:</p>
                  <p className="font-semibold text-gray-900">{fleetOwner.contact}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Total Trips:</p>
                  <p className="font-semibold text-gray-900">{stats.totalTrips}</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-300">
                <p className="text-xs text-blue-700 mb-1 font-medium">Total Amount</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg border-2 border-green-300">
                <p className="text-xs text-green-700 mb-1 font-medium">Advances Paid</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(stats.advancesPaid)}</p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg border-2 border-red-300">
                <p className="text-xs text-red-700 mb-1 font-medium">Pending Amount</p>
                <p className="text-lg font-bold text-red-900">{formatCurrency(stats.pendingAmount)}</p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-300">
                <p className="text-xs text-purple-700 mb-1 font-medium">Total POD</p>
                <p className="text-lg font-bold text-purple-900">{formatCurrency(stats.totalPOD)}</p>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg border-2 border-orange-300">
                <p className="text-xs text-orange-700 mb-1 font-medium">POD Pending</p>
                <p className="text-lg font-bold text-orange-900">{formatCurrency(stats.podPending)}</p>
              </div>
            </div>

              {/* Trips Statement Table */}
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-800 text-white p-3">
                <h3 className="font-semibold text-lg">Trips Statement ({getFilteredTrips().length} Trips)</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Trip Number</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Vehicle No.</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Trip/Load Date</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">POD Pending</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total POD</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Fleet Advances</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getFilteredTrips().map(trip => {
                      const tripAdvances = advances[trip._id] || [];
                      const advanceTotal = tripAdvances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
                      const hireTotal = trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;
                      
                      return (
                        <tr key={trip._id}>
                          <td className="px-4 py-3 font-semibold text-gray-900">{trip.tripNumber}</td>
                          <td className="px-4 py-3 text-gray-700">{trip.vehicleId?.vehicleNumber || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(trip.loadDate)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(hireTotal)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(0)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(trip.podBalance)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(advanceTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {getFilteredTrips().length > 0 && (
                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">TOTAL:</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(getFilteredTrips().reduce((sum, trip) => {
                            const hireTotal = trip.clients?.reduce((s, c) => s + (c.truckHireCost || 0), 0) || 0;
                            return sum + hireTotal;
                          }, 0))}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(0)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(getFilteredTrips().reduce((sum, trip) => sum + (trip.podBalance || 0), 0))}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">
                          {formatCurrency(getFilteredTrips().reduce((sum, trip) => {
                            const tripAdvances = advances[trip._id] || [];
                            return sum + tripAdvances.reduce((s, adv) => s + (adv.amount || 0), 0);
                          }, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
