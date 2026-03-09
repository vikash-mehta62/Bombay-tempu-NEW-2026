'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tripAPI } from '@/lib/api';
import { Plus, Search, Filter, Edit, Trash2, MapPin, Calendar, TrendingUp, TrendingDown, Eye, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import TripFormModal from '@/components/TripFormModal';

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate state for input
  const [statusFilter, setStatusFilter] = useState('');
  const [showNoFixAmount, setShowNoFixAmount] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTrips, setTotalTrips] = useState(0);
  const [limit] = useState(10);
  
  // Overall stats
  const [overallStats, setOverallStats] = useState({
    totalTrips: 0,
    totalRevenue: 0,
    totalProfit: 0,
    inProgressTrips: 0
  });
  
  // Trip advances and expenses
  const [tripAdvances, setTripAdvances] = useState({});
  const [tripExpenses, setTripExpenses] = useState({});

  useEffect(() => {
    loadTrips();
    loadOverallStats();
  }, [currentPage, statusFilter, searchTerm, showNoFixAmount]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        showNoFixAmount: showNoFixAmount ? 'true' : undefined
      };
      
      const response = await tripAPI.getAll(params);
      const tripsData = response.data.data;
      setTrips(tripsData);
      
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages);
        setTotalTrips(response.data.pagination.totalTrips);
      }
      
      // Load advances and expenses for each trip
      await loadTripsAdvancesAndExpenses(tripsData);
    } catch (error) {
      toast.error('Failed to load trips');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadTripsAdvancesAndExpenses = async (tripsData) => {
    console.log('Loading advances and expenses for trips:', tripsData.length);
    const advancesData = {};
    const expensesData = {};
    
    // Use Promise.all to fetch all data in parallel
    await Promise.all(
      tripsData.map(async (trip) => {
        try {
          // Fetch advances
          const advancesRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/trip-advances/trip/${trip._id}`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }
          );
          const advancesJson = await advancesRes.json();
          advancesData[trip._id] = advancesJson.totalAdvances || 0;
          console.log(`Trip ${trip.tripNumber} - Advances:`, advancesData[trip._id]);
          
          // Fetch expenses
          const expensesRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/trip-expenses/trip/${trip._id}`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }
          );
          const expensesJson = await expensesRes.json();
          expensesData[trip._id] = expensesJson.totalExpenses || 0;
          console.log(`Trip ${trip.tripNumber} - Expenses:`, expensesData[trip._id]);
        } catch (error) {
          console.error(`Error loading data for trip ${trip._id}:`, error);
          advancesData[trip._id] = 0;
          expensesData[trip._id] = 0;
        }
      })
    );
    
    console.log('Final advances data:', advancesData);
    console.log('Final expenses data:', expensesData);
    setTripAdvances(advancesData);
    setTripExpenses(expensesData);
  };
  
  const loadOverallStats = async () => {
    try {
      const response = await tripAPI.getStats();
      if (response.data.data.overall) {
        setOverallStats(response.data.data.overall);
      }
    } catch (error) {
      console.error('Failed to load overall stats:', error);
    }
  };

  const handleAddTrip = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEditTrip = (trip) => {
    setEditData(trip);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      await tripAPI.delete(id);
      toast.success('Trip deleted successfully');
      loadTrips();
      loadOverallStats();
    } catch (error) {
      toast.error('Failed to delete trip');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditData(null);
  };

  const handleSuccess = () => {
    loadTrips();
    loadOverallStats();
  };
  
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1); // Reset to first page on search
  };
  
  const handleSearchInputChange = (value) => {
    setSearchInput(value);
  };
  
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page on filter
  };
  
  const handleNoFixAmountFilter = (checked) => {
    setShowNoFixAmount(checked);
    setCurrentPage(1); // Reset to first page on filter
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Check if trip has client rate between 1-10
  const hasNoFixAmount = (trip) => {
    return trip.clients?.some(c => c.clientRate >= 1 && c.clientRate <= 10);
  };
  
  // Client Export Function
  const handleClientExport = async () => {
    try {
      toast.loading('Generating Client Export...');
      
      // Fetch all trips (no pagination)
      const response = await tripAPI.getAll({ limit: 100000 });
      const allTrips = response.data.data;
      
      // Create CSV data
      const headers = [
        'Trip Number',
        'Date',
        'Gaadi No',
        'From',
        'To',
        'Client Name',
        'Client Fright',
        'Apna Fright',
        'Truck Hire Cost',
        'Adjustments',
        'Client Advance Paid',
        'Client Expance',
        'Client Balance',
        'Pod Status',
        'POD Submit Date'
      ];
      
      const rows = [];
      
      // Fetch client payments and expenses for all trips
      for (const trip of allTrips) {
        for (const client of trip.clients || []) {
          try {
            // Fetch client payments and expenses
            const [paymentsRes, expensesRes] = await Promise.all([
              fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/client-payments/trip/${trip._id}/client/${client.clientId?._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              }),
              fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/client-expenses/trip/${trip._id}/client/${client.clientId?._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              })
            ]);
            
            const paymentsData = await paymentsRes.json();
            const expensesData = await expensesRes.json();
            
            const clientAdvances = paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
            const clientExpenses = expensesData.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
            
            // Calculate: Client Balance = Client Rate - Adjustments - Advances - Expenses
            const apnaFright = (client.clientRate || 0) - (client.adjustment || 0);
            const clientBalance = apnaFright - clientAdvances + clientExpenses;
            
            const row = [
              trip.tripNumber || 'N/A',
              formatDate(client.loadDate || trip.loadDate),
              trip.vehicleId?.vehicleNumber || 'N/A',
              client.originCity?.cityName || 'N/A',
              client.destinationCity?.cityName || 'N/A',
              client.clientId?.fullName || client.clientId?.companyName || 'N/A',
              client.clientRate || 0,
              apnaFright,
              client.truckHireCost || 0,
              client.adjustment || 0,
              clientAdvances,
              clientExpenses,
              clientBalance,
              trip.status || 'N/A',
              trip.podHistory?.length > 0 ? formatDate(trip.podHistory[0].submittedAt) : 'N/A'
            ];
            rows.push(row);
          } catch (error) {
            console.error('Error fetching client data:', error);
            // Add row with 0 values if API fails
            const apnaFright = (client.clientRate || 0) - (client.adjustment || 0);
            const row = [
              trip.tripNumber || 'N/A',
              formatDate(client.loadDate || trip.loadDate),
              trip.vehicleId?.vehicleNumber || 'N/A',
              client.originCity?.cityName || 'N/A',
              client.destinationCity?.cityName || 'N/A',
              client.clientId?.fullName || client.clientId?.companyName || 'N/A',
              client.clientRate || 0,
              apnaFright,
              client.truckHireCost || 0,
              client.adjustment || 0,
              0,
              0,
              apnaFright,
              trip.status || 'N/A',
              trip.podHistory?.length > 0 ? formatDate(trip.podHistory[0].submittedAt) : 'N/A'
            ];
            rows.push(row);
          }
        }
      }
      
      // Convert to CSV with UTF-8 BOM for proper encoding
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Client_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.dismiss();
      toast.success('Client Export downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export client data');
      console.error(error);
    }
  };
  
  // Fleet Export Function
  const handleFleetExport = async () => {
    try {
      toast.loading('Generating Fleet Export...');
      
      // Fetch all trips (no pagination)
      const response = await tripAPI.getAll({ limit: 10000 });
      const allTrips = response.data.data;
      
      // Filter only fleet-owned trips
      const fleetTrips = allTrips.filter(trip => trip.vehicleId?.ownershipType === 'fleet_owner');
      
      // Create CSV data
      const headers = [
        'Trip Number',
        'Date',
        'Fleet Owner Name',
        'Gaadi No',
        'From',
        'To',
        'Clients Name (Fright)',
        'Apna Fright',
        'Truck Hire Cost',
        'Adjustments',
        'Truck Advance Paid',
        'Truck Expance',
        'Truck Balance',
        'Pod Status',
        'POD Submit Date',
        'Remarks'
      ];
      
      const rows = [];
      
      // Fetch trip advances and expenses for fleet trips
      for (const trip of fleetTrips) {
        try {
          // Fetch trip advances and expenses
          const [advancesRes, expensesRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/trip-advances/trip/${trip._id}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/trip-expenses/trip/${trip._id}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
          ]);
          
          const advancesData = await advancesRes.json();
          const expensesData = await expensesRes.json();
          
          console.log(expensesData)
          const truckAdvances = advancesData.totalAdvances || 0;
          const truckExpenses = expensesData.totalExpenses || 0;
          
          // Combine all clients info without rupee symbol
          const clientsInfo = trip.clients?.map(c => 
            `${c.clientId?.fullName || c.clientId?.companyName || 'N/A'} (Rs ${c.clientRate || 0})`
          ).join('; ') || 'N/A';
          
          const fromCities = trip.clients?.map(c => c.originCity?.cityName).filter(Boolean).join(', ') || 'N/A';
          const toCities = trip.clients?.map(c => c.destinationCity?.cityName).filter(Boolean).join(', ') || 'N/A';
          
          const truckHireCost = trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;
          
          // Calculate: Truck Balance = (Hire Cost + Expenses) - Commission - POD - Advances
          const commission = trip.commissionAmount || 0;
          const podBalance = trip.podBalance || 0;
          const truckBalance = (truckHireCost + truckExpenses) - commission - podBalance - truckAdvances;
          
          const row = [
            trip.tripNumber || 'N/A',
            formatDate(trip.loadDate),
            trip.vehicleId?.fleetOwnerId?.fullName || 'N/A',
            trip.vehicleId?.vehicleNumber || 'N/A',
            fromCities,
            toCities,
            clientsInfo,
            trip.totalClientRevenue -trip.totalAdjustments  || 0,
            truckHireCost,
            trip.totalAdjustments || 0,
            truckAdvances,
            truckExpenses,
            truckBalance,
            trip.status || 'N/A',
            trip.podHistory?.length > 0 ? formatDate(trip.podHistory[0].submittedAt) : 'N/A',
            trip.additionalInstructions || ''
          ];
          rows.push(row);
        } catch (error) {
          console.error('Error fetching fleet data:', error);
          // Add row with 0 values if API fails
          const clientsInfo = trip.clients?.map(c => 
            `${c.clientId?.fullName || c.clientId?.companyName || 'N/A'} (Rs ${c.clientRate || 0})`
          ).join('; ') || 'N/A';
          
          const fromCities = trip.clients?.map(c => c.originCity?.cityName).filter(Boolean).join(', ') || 'N/A';
          const toCities = trip.clients?.map(c => c.destinationCity?.cityName).filter(Boolean).join(', ') || 'N/A';
          
          const row = [
            trip.tripNumber || 'N/A',
            formatDate(trip.loadDate),
            trip.vehicleId?.fleetOwnerId?.fullName || 'N/A',
            trip.vehicleId?.vehicleNumber || 'N/A',
            fromCities,
            toCities,
            clientsInfo,
            trip.totalClientRevenue || 0,
            trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0,
            trip.totalAdjustments || 0,
            0,
            0,
            0,
            trip.status || 'N/A',
            trip.podHistory?.length > 0 ? formatDate(trip.podHistory[0].submittedAt) : 'N/A',
            trip.additionalInstructions || ''
          ];
          rows.push(row);
        }
      }
      
      // Convert to CSV with UTF-8 BOM for proper encoding
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Fleet_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.dismiss();
      toast.success('Fleet Export downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export fleet data');
      console.error(error);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-600">Manage your trip operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleClientExport}
            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Client Export</span>
          </button>
          <button
            onClick={handleFleetExport}
            className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Fleet Export</span>
          </button>
          <button
            onClick={handleAddTrip}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Trip</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Overall Stats from API */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalTrips}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🚛</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {overallStats.inProgressTrips}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🚚</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(overallStats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Profit</p>
              <p className={`text-2xl font-bold ${overallStats.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(overallStats.totalProfit)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              overallStats.totalProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'
            }`}>
              <span className="text-2xl">{overallStats.totalProfit >= 0 ? '📈' : '📉'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search trips by trip number, vehicle, driver, client, fleet owner..."
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="input pl-10 w-full"
                />
              </div>
              <button
                onClick={handleSearch}
                className="btn btn-primary whitespace-nowrap"
              >
                Search
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {/* No Fix Amount Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="noFixAmount"
              checked={showNoFixAmount}
              onChange={(e) => handleNoFixAmountFilter(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="noFixAmount" className="text-sm font-medium text-gray-700">
              Show Only Client No Fix Amount (Rate 1-10)
            </label>
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trip Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle & Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Load Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adv Truck Expance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Truck Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit/Loss
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
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No trips found
                  </td>
                </tr>
              ) : (
                trips.map((trip) => {
                  const isNoFixAmount = hasNoFixAmount(trip);
                  const tripAdvance = tripAdvances[trip._id] || 0;
                  const tripExpense = tripExpenses[trip._id] || 0;
                  
                  // Calculate Truck Balance based on ownership type
                  const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
                  let truckBalance = 0;
                  
                  if (isFleetOwned) {
                    // Fleet-Owned: Truck Balance = (Hire Cost + Expenses) - Commission - POD - Advances
                    const truckHireCost = trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;
                    const commission = trip.commissionAmount || 0;
                    const podBalance = trip.podBalance || 0;
                    truckBalance = (truckHireCost + tripExpense) - commission - podBalance - tripAdvance;
                  } else {
                    // Self-Owned: Truck Balance = Revenue - Expenses - Advances
                    truckBalance = trip.totalClientRevenue - tripExpense - tripAdvance;
                  }
                  
                  return (
                    <tr 
                      key={trip._id} 
                      className={`hover:bg-gray-50 ${isNoFixAmount ? 'bg-red-100 border-l-4 border-red-600' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {trip.tripNumber}
                            </div>
                            {isNoFixAmount && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-200 text-yellow-800 rounded">
                                No Fix
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {trip.clients?.map((client, index) => (
                              <div key={index}>
                                {client.clientId?.fullName || client.clientId?.companyName || 'N/A'}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {trip.vehicleId?.vehicleNumber || 'N/A'}
                          </div>
                          {trip.driverId && (
                            <div className="text-xs text-gray-500">
                              {trip.driverId.fullName}
                            </div>
                          )}
                          {trip.vehicleId?.fleetOwnerId && (
                            <div className="text-xs text-blue-600">
                              Fleet: {trip.vehicleId.fleetOwnerId.fullName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {trip.clients && trip.clients.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-green-600" />
                              <span className="text-xs">
                                {trip.clients[0].originCity?.cityName || 'N/A'}
                              </span>
                              <span className="text-xs text-gray-400">→</span>
                              <MapPin className="w-3 h-3 text-red-600" />
                              <span className="text-xs">
                                {trip.clients[0].destinationCity?.cityName || 'N/A'}
                              </span>
                            </div>
                          )}
                          {trip.clients && trip.clients.length > 1 && (
                            <div className="text-xs text-gray-500 mt-1">
                              +{trip.clients.length - 1} more route(s)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {trip.clients && trip.clients.length > 0 ? (
                            trip.clients.map((client, idx) => (
                              <div key={idx} className="flex items-center text-xs mb-1">
                                <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                {formatDate(client.loadDate)}
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center text-xs">
                              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                              {formatDate(trip.loadDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          isNoFixAmount ? 'text-red-600 font-bold' : 'text-green-600'
                        }`}>
                          {formatCurrency(trip.totalClientRevenue)}
                          {isNoFixAmount && (
                            <div className="text-xs text-red-500 mt-1">
                              ⚠️ No Fix Amount
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tripAdvances[trip._id] !== undefined ? (
                            <>
                              <div className="text-xs text-gray-500">Adv: {formatCurrency(tripAdvance)}</div>
                              <div className="text-xs text-gray-500">Exp: {formatCurrency(tripExpense)}</div>
                            </>
                          ) : (
                            <div className="text-xs text-gray-400">Loading...</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tripAdvances[trip._id] !== undefined ? (
                          <div className={`text-sm font-medium ${
                            truckBalance >= 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(truckBalance)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Loading...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold flex items-center ${
                          trip.profitLoss >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {trip.profitLoss >= 0 ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {formatCurrency(trip.profitLoss)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`badge ${getStatusBadgeColor(trip.status)}`}
                        >
                          {trip.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              router.push(`/dashboard/trips/${trip._id}`);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditTrip(trip)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(trip._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalTrips)} of {totalTrips} trips
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Trip Form Modal */}
      <TripFormModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        editData={editData}
      />
    </div>
  );
}
