'use client';

import { useState, useEffect } from 'react';
import { 
  Plus,
  Loader,
  FileText,
  Trash2
} from 'lucide-react';
import { driverCalculationAPI } from '@/lib/api';
import { toast } from 'sonner';
import DriverCalculationForm from './DriverCalculationForm';

export default function DriverCalculationTab({ driver, formatCurrency, formatDate, isAdminView = false }) {
  const [loading, setLoading] = useState(true);
  const [calculations, setCalculations] = useState([]);
  const [showCalculationForm, setShowCalculationForm] = useState(false);
  const [calculatedTrips, setCalculatedTrips] = useState(new Set());
  const [editingCalculation, setEditingCalculation] = useState(null);

  useEffect(() => {
    if (driver?._id) {
      loadCalculations();
    }
  }, [driver]);

  const loadCalculations = async () => {
    try {
      setLoading(true);
      const response = await driverCalculationAPI.getByDriver(driver._id);
      const calcs = response.data.data || [];
      setCalculations(calcs);
      
      // Mark trips that have been calculated
      const calculatedTripIds = new Set();
      calcs.forEach(calc => {
        calc.tripIds?.forEach(tripId => {
          calculatedTripIds.add(typeof tripId === 'string' ? tripId : tripId._id);
        });
      });
      setCalculatedTrips(calculatedTripIds);
    } catch (error) {
      console.error('Error loading calculations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCalculation = (calculation) => {
    setEditingCalculation(calculation);
    setShowCalculationForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this calculation?')) return;
    
    try {
      await driverCalculationAPI.delete(id);
      toast.success('Calculation deleted');
      loadCalculations();
    } catch (error) {
      toast.error('Failed to delete calculation');
    }
  };

  const handleCloseForm = () => {
    setShowCalculationForm(false);
    setEditingCalculation(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Driver Calculations</h3>
          <p className="text-sm text-gray-600">Multi-trip KM calculations for self-owned vehicles</p>
        </div>
        {isAdminView && (
          <button
            onClick={() => setShowCalculationForm(true)}
            className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Calculation</span>
          </button>
        )}
      </div>

      {/* Calculation Form Modal */}
      <DriverCalculationForm
        isOpen={showCalculationForm}
        onClose={handleCloseForm}
        driver={driver}
        calculatedTrips={calculatedTrips}
        onSaveSuccess={loadCalculations}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        editingCalculation={editingCalculation}
      />

      {/* Saved Calculations */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Saved Calculations</h4>
        {calculations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No calculations found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calculations.map(calc => (
              <div 
                key={calc._id} 
                className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                  isAdminView ? 'cursor-pointer' : ''
                }`}
                onClick={isAdminView ? () => handleEditCalculation(calc) : undefined}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {calc.tripIds?.length || 0} Trip(s) - {formatDate(calc.createdAt)}
                    </p>
                    {calc.originalTripData && calc.originalTripData.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Trips: {calc.originalTripData.map(t => t.tripNumber).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-gray-600">
                      Created by: {calc.createdBy?.fullName || 'Unknown'}
                    </p>
                  </div>
                  {isAdminView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(calc._id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Total KM</p>
                    <p className="text-sm font-bold text-gray-900">{calc.totalKM} KM</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">KM Value</p>
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(calc.kmValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(calc.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Due</p>
                    <p className={`text-sm font-bold ${calc.due < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(calc.due))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
