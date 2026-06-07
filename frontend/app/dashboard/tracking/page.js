'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit, MapPin, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { tripAPI } from '@/lib/api';
import TruckLoader from '@/components/TruckLoader';

const emptyForm = {
  trackingDate: new Date().toISOString().split('T')[0],
  location: '',
  statusNote: '',
  latitude: '',
  longitude: ''
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getLatestTracking = (trip) => {
  const history = trip.trackingHistory || [];
  if (!history.length) return null;

  return [...history].sort((a, b) => new Date(b.trackingDate) - new Date(a.trackingDate))[0];
};

export default function TrackingPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTripId, setSelectedTripId] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [editingEntry, setEditingEntry] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTrackingTrips();
  }, []);

  const loadTrackingTrips = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getTrackingTrips();
      const data = response.data.data || [];
      setTrips(data);
      if (!selectedTripId && data.length) {
        setSelectedTripId(data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load tracking trips');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return trips.filter((trip) => {
      const clientNames = (trip.clients || [])
        .map((client) => client.clientId?.fullName || client.clientId?.companyName || '')
        .join(' ');

      return [
        trip.tripNumber,
        trip.vehicleId?.vehicleNumber,
        trip.driverId?.fullName,
        clientNames
      ].join(' ').toLowerCase().includes(term);
    });
  }, [trips, searchTerm]);

  const selectedTrip = trips.find((trip) => trip._id === selectedTripId) || filteredTrips[0];
  const sortedHistory = [...(selectedTrip?.trackingHistory || [])]
    .sort((a, b) => new Date(b.trackingDate) - new Date(a.trackingDate));

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingEntry(null);
  };

  const handleTripSelect = (tripId) => {
    setSelectedTripId(tripId);
    resetForm();
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      trackingDate: entry.trackingDate ? new Date(entry.trackingDate).toISOString().split('T')[0] : emptyForm.trackingDate,
      location: entry.location || '',
      statusNote: entry.statusNote || '',
      latitude: entry.latitude ?? '',
      longitude: entry.longitude ?? ''
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTrip) return;

    if (!formData.location.trim()) {
      toast.error('Location is required');
      return;
    }

    try {
      setSaving(true);
      if (editingEntry) {
        await tripAPI.updateTracking(selectedTrip._id, editingEntry._id, formData);
        toast.success('Tracking updated');
      } else {
        await tripAPI.addTracking(selectedTrip._id, formData);
        toast.success('Tracking added');
      }

      resetForm();
      await loadTrackingTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save tracking');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry) => {
    if (!selectedTrip || !confirm('Delete this tracking entry?')) return;

    try {
      await tripAPI.deleteTracking(selectedTrip._id, entry._id);
      toast.success('Tracking deleted');
      await loadTrackingTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete tracking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <TruckLoader size="lg" message="Loading tracking..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Tracking</h1>
          <p className="text-gray-600">Manage daily locations for active trips</p>
        </div>
        <div className="text-sm text-gray-600">
          Active trips: <span className="font-semibold text-gray-900">{trips.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="input pl-9"
                placeholder="Search trip, vehicle, driver..."
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[720px] overflow-y-auto">
            {filteredTrips.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 text-center">No active trips found</div>
            ) : (
              filteredTrips.map((trip) => {
                const latest = getLatestTracking(trip);
                const isSelected = selectedTrip?._id === trip._id;

                return (
                  <button
                    key={trip._id}
                    type="button"
                    onClick={() => handleTripSelect(trip._id)}
                    className={`w-full text-left p-4 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{trip.tripNumber}</p>
                        <p className="text-sm text-gray-600">{trip.vehicleId?.vehicleNumber || 'No vehicle'}</p>
                      </div>
                      <span className="badge bg-yellow-100 text-yellow-800">
                        {trip.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      <p>Driver: {trip.driverId?.fullName || 'N/A'}</p>
                      <p>
                        Latest: {latest ? `${latest.location} (${formatDate(latest.trackingDate)})` : 'No tracking yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          {selectedTrip ? (
            <>
              <div className="card">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">{selectedTrip.tripNumber}</h2>
                      <span className="badge bg-yellow-100 text-yellow-800">
                        {selectedTrip.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
                      <p>Vehicle: {selectedTrip.vehicleId?.vehicleNumber || 'N/A'}</p>
                      <p>Driver: {selectedTrip.driverId?.fullName || 'N/A'}</p>
                      <p>Load Date: {formatDate(selectedTrip.loadDate)}</p>
                      <p>Tracking Entries: {selectedTrip.trackingHistory?.length || 0}</p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/trips/${selectedTrip._id}`}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    Open Trip
                  </Link>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingEntry ? 'Edit Tracking' : 'Add Daily Tracking'}
                  </h3>
                  {editingEntry && (
                    <button type="button" onClick={resetForm} className="btn btn-secondary flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date</label>
                    <input
                      type="date"
                      value={formData.trackingDate}
                      onChange={(event) => setFormData({ ...formData, trackingDate: event.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                      className="input"
                      placeholder="Hisar, Jaipur highway, warehouse..."
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Latitude (Optional)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(event) => setFormData({ ...formData, latitude: event.target.value })}
                      className="input"
                      placeholder="29.1492"
                    />
                  </div>

                  <div>
                    <label className="label">Longitude (Optional)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(event) => setFormData({ ...formData, longitude: event.target.value })}
                      className="input"
                      placeholder="75.7217"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Status Note</label>
                    <textarea
                      value={formData.statusNote}
                      onChange={(event) => setFormData({ ...formData, statusNote: event.target.value })}
                      className="input"
                      rows="3"
                      placeholder="Reached loading point, vehicle halted, unloading pending..."
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2">
                      {editingEntry ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{saving ? 'Saving...' : editingEntry ? 'Update Tracking' : 'Add Tracking'}</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking History</h3>
                {sortedHistory.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">
                    No tracking added for this trip yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedHistory.map((entry) => (
                      <div key={entry._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-gray-900 font-semibold">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              {entry.location}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-4 h-4" />
                                {formatDate(entry.trackingDate)}
                              </span>
                              {entry.addedBy && <span>By: {entry.addedBy.fullName || entry.addedBy.username}</span>}
                              {entry.latitude !== null && entry.longitude !== null && (
                                <span>
                                  {entry.latitude}, {entry.longitude}
                                </span>
                              )}
                            </div>
                            {entry.statusNote && (
                              <p className="mt-3 text-sm text-gray-700">{entry.statusNote}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(entry)}
                              className="btn btn-secondary flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(entry)}
                              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card py-16 text-center text-gray-500">
              No active trips available for tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
