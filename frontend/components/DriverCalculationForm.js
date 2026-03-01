'use client';

import { useState, useEffect } from 'react';
import { 
  Calculator, 
  Save, 
  Download,
  X,
  Loader
} from 'lucide-react';
import { tripAPI, tripAdvanceAPI, tripExpenseAPI, driverCalculationAPI, vehicleAPI } from '@/lib/api';
import { toast } from 'sonner';
import Modal from './Modal';

export default function DriverCalculationForm({ 
  isOpen, 
  onClose, 
  driver, 
  calculatedTrips,
  onSaveSuccess,
  formatCurrency,
  formatDate,
  editingCalculation 
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trips, setTrips] = useState([]);
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Form inputs
  const [oldKM, setOldKM] = useState(0);
  const [newKM, setNewKM] = useState(0);
  const [perKMRate, setPerKMRate] = useState(19.5);
  const [pichla, setPichla] = useState(0);
  const [nextServiceKM, setNextServiceKM] = useState(0);
  
  // Auto-calculated values
  const [totalKM, setTotalKM] = useState(0);
  const [kmValue, setKmValue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalAdvances, setTotalAdvances] = useState(0);
  const [total, setTotal] = useState(0);
  const [due, setDue] = useState(0);
  const [advanceDetails, setAdvanceDetails] = useState([]);
  const [expenseDetails, setExpenseDetails] = useState([]);

  useEffect(() => {
    if (isOpen && driver?._id) {
      loadTrips();
    }
  }, [isOpen, driver]);

  // Load editing calculation data
  useEffect(() => {
    if (editingCalculation && trips.length > 0) {
      console.log('Loading editing calculation:', editingCalculation);
      
      // Set form values
      setOldKM(editingCalculation.oldKM || 0);
      setNewKM(editingCalculation.newKM || 0);
      setPerKMRate(editingCalculation.perKMRate || 19.5);
      setPichla(editingCalculation.pichla || 0);
      setNextServiceKM(editingCalculation.nextServiceKM || 0);
      
      // Set selected trips
      const tripIds = editingCalculation.tripIds?.map(t => typeof t === 'string' ? t : t._id) || [];
      setSelectedTrips(tripIds);
      
      // Set vehicle from original trip data
      if (editingCalculation.originalTripData && editingCalculation.originalTripData.length > 0) {
        const firstTrip = editingCalculation.originalTripData[0];
        if (firstTrip.vehicleId) {
          setSelectedVehicle(firstTrip.vehicleId);
        }
      }
      
      // Set calculated values
      setTotalKM(editingCalculation.totalKM || 0);
      setKmValue(editingCalculation.kmValue || 0);
      setTotalExpenses(editingCalculation.totalExpenses || 0);
      setTotalAdvances(editingCalculation.totalAdvances || 0);
      setTotal(editingCalculation.total || 0);
      setDue(editingCalculation.due || 0);
    }
  }, [editingCalculation, trips]);

  // Auto-calculate whenever inputs change
  useEffect(() => {
    if (selectedTrips.length > 0 && newKM > oldKM && trips.length > 0) {
      calculateValues();
    }
  }, [selectedTrips, oldKM, newKM, perKMRate, pichla, trips]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getAll();
      const allTrips = response.data.data;
      
      console.log('All trips loaded:', allTrips.length);
      
      const driverTrips = allTrips.filter(trip => 
        trip.driverId?._id === driver._id && 
        trip.isActive &&
        trip.vehicleId?.ownershipType === 'self_owned'
      );
      
      console.log('Driver trips filtered:', driverTrips.length);
      
      const tripsWithData = await Promise.all(
        driverTrips.map(async (trip) => {
          try {
            console.log(`Loading data for trip ${trip.tripNumber}...`);
            const [advResponse, expResponse] = await Promise.all([
              tripAdvanceAPI.getByTrip(trip._id),
              tripExpenseAPI.getByTrip(trip._id)
            ]);
            
            const advances = advResponse.data.data || [];
            const expenses = expResponse.data.data || [];
            
            console.log(`Trip ${trip.tripNumber}: ${advances.length} advances, ${expenses.length} expenses`);
            
            return {
              ...trip,
              advances,
              expenses
            };
          } catch (error) {
            console.error(`Error loading data for trip ${trip.tripNumber}:`, error);
            return {
              ...trip,
              advances: [],
              expenses: []
            };
          }
        })
      );
      
      console.log('Trips with data loaded:', tripsWithData);
      setTrips(tripsWithData);
    } catch (error) {
      console.error('Error loading trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleData = async (vehicleId) => {
    try {
      const response = await vehicleAPI.getById(vehicleId);
      const vehicle = response.data.data;
      if (vehicle.nextServiceKM) {
        setNextServiceKM(vehicle.nextServiceKM);
      }
      if (vehicle.currentOdometer) {
        setOldKM(vehicle.currentOdometer);
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    }
  };

  const handleTripSelection = (trip) => {
    const tripId = trip._id;
    
    if (calculatedTrips.has(tripId)) {
      toast.error('This trip has already been calculated');
      return;
    }
    
    setSelectedTrips(prev => {
      if (prev.includes(tripId)) {
        return prev.filter(id => id !== tripId);
      } else {
        if (prev.length === 0 && trip.vehicleId) {
          loadVehicleData(trip.vehicleId._id);
          setSelectedVehicle(trip.vehicleId);
        }
        return [...prev, tripId];
      }
    });
  };

  const calculateValues = () => {
    if (selectedTrips.length === 0) {
      console.log('No trips selected');
      return;
    }
    
    if (oldKM >= newKM) {
      console.log('Invalid KM values:', { oldKM, newKM });
      return;
    }
    
    // Calculate KM
    const km = newKM - oldKM;
    const kmVal = km * perKMRate;
    
    // Get selected trip data
    const selectedTripData = trips.filter(t => selectedTrips.includes(t._id));
    
    console.log('=== CALCULATION START ===');
    console.log('Selected trips:', selectedTripData.length);
    console.log('Selected trip IDs:', selectedTrips);
    console.log('All trips:', trips.map(t => ({ id: t._id, number: t.tripNumber, advances: t.advances?.length, expenses: t.expenses?.length })));
    
    // Prepare advance details - ONLY driver advances
    const advDetails = [];
    selectedTripData.forEach(trip => {
      console.log(`\n--- Trip ${trip.tripNumber} ---`);
      console.log('All advances:', trip.advances);
      
      if (trip.advances && trip.advances.length > 0) {
        // Filter only driver advances (where driverId is not null)
        const driverAdvances = trip.advances.filter(adv => {
          console.log('Checking advance:', adv);
          console.log('Has driverId?', !!adv.driverId);
          return adv.driverId;
        });
        console.log(`Driver advances found: ${driverAdvances.length}`);
        
        driverAdvances.forEach(adv => {
          const advDetail = {
            tripNumber: trip.tripNumber,
            date: adv.date,
            amount: adv.amount,
            method: adv.paymentMethod || 'A/c',
            reason: adv.description || 'Advance'
          };
          console.log('Adding advance detail:', advDetail);
          advDetails.push(advDetail);
        });
      } else {
        console.log('No advances for this trip');
      }
    });
    
    // Prepare expense details - ALL expenses for self-owned vehicles
    const expDetails = [];
    selectedTripData.forEach(trip => {
      console.log(`\n--- Trip ${trip.tripNumber} Expenses ---`);
      console.log('All expenses:', trip.expenses);
      
      if (trip.expenses && trip.expenses.length > 0) {
        trip.expenses.forEach(exp => {
          const expDetail = {
            tripNumber: trip.tripNumber,
            date: exp.date || exp.paidAt,
            amount: exp.amount,
            category: exp.expenseType || exp.type || exp.category || 'Expense',
            remark: exp.description || ''
          };
          console.log('Adding expense detail:', expDetail);
          expDetails.push(expDetail);
        });
      } else {
        console.log('No expenses for this trip');
      }
    });
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Total advance details:', advDetails.length, advDetails);
    console.log('Total expense details:', expDetails.length, expDetails);
    
    setAdvanceDetails(advDetails);
    setExpenseDetails(expDetails);
    
    // Calculate totals
    const expenses = expDetails.reduce((sum, e) => sum + (e.amount || 0), 0);
    const advances = advDetails.reduce((sum, a) => sum + (a.amount || 0), 0);
    
    const tot = kmVal + expenses + Number(pichla);
    const dueAmt = tot - advances;
    
    setTotalKM(km);
    setKmValue(kmVal);
    setTotalExpenses(expenses);
    setTotalAdvances(advances);
    setTotal(tot);
    setDue(dueAmt);
    
    console.log('Calculation summary:', {
      totalKM: km,
      kmValue: kmVal,
      totalExpenses: expenses,
      totalAdvances: advances,
      total: tot,
      due: dueAmt
    });
    console.log('=== CALCULATION END ===\n');
  };

  const handleSave = async () => {
    if (selectedTrips.length === 0) {
      toast.error('Please select at least one trip');
      return;
    }
    
    if (oldKM >= newKM) {
      toast.error('New KM should be greater than Old KM');
      return;
    }
    
    if (!selectedVehicle) {
      toast.error('No vehicle selected');
      return;
    }
    
    try {
      setSaving(true);
      const calculationData = {
        driverId: driver._id,
        vehicleId: selectedVehicle._id,
        tripIds: selectedTrips,
        oldKM,
        newKM,
        perKMRate,
        pichla,
        totalKM,
        kmValue,
        totalExpenses,
        totalAdvances,
        total,
        due,
        nextServiceKM,
        originalTripData: trips.filter(t => selectedTrips.includes(t._id))
      };
      
      if (editingCalculation) {
        // Update existing calculation
        await driverCalculationAPI.update(editingCalculation._id, calculationData);
        toast.success('Calculation updated successfully');
      } else {
        // Create new calculation
        await driverCalculationAPI.create(calculationData);
        toast.success('Calculation saved successfully');
      }
      
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving calculation:', error);
      toast.error(editingCalculation ? 'Failed to update calculation' : 'Failed to save calculation');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      // Use html2canvas to convert the preview to PDF
      import('html2canvas').then(({ default: html2canvas }) => {
        import('jspdf').then(({ default: jsPDF }) => {
          const previewElement = document.getElementById('calculation-preview');
          
          if (!previewElement) {
            toast.error('Preview not found');
            return;
          }
          
          // Show loading toast
          const loadingToast = toast.loading('Generating PDF...');
          
          html2canvas(previewElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });
            
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            // Add more pages if needed
            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            
            // Save PDF
            pdf.save(`Driver_Calculation_${driver.fullName}_${new Date().toISOString().split('T')[0]}.pdf`);
            
            toast.dismiss(loadingToast);
            toast.success('PDF downloaded successfully');
          }).catch(error => {
            console.error('Error generating PDF:', error);
            toast.dismiss(loadingToast);
            toast.error('Failed to generate PDF');
          });
        });
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCalculation ? "Edit Driver Calculation" : "Driver Calculation"} size="full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left Side - Inputs */}
        <div className="space-y-6 overflow-y-auto pr-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Trip Selection */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Select Trips</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {trips.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No trips available</p>
                ) : (
                  trips.map(trip => {
                    const isCalculated = calculatedTrips.has(trip._id);
                    return (
                      <div
                        key={trip._id}
                        onClick={() => !isCalculated && handleTripSelection(trip)}
                        className={`p-2 border rounded cursor-pointer transition-all ${
                          isCalculated
                            ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
                            : selectedTrips.includes(trip._id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{trip.tripNumber}</p>
                            <p className="text-xs text-gray-600">{formatDate(trip.loadDate)}</p>
                            {isCalculated && (
                              <span className="text-xs text-red-600 font-medium">Already Calculated</span>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedTrips.includes(trip._id)}
                            disabled={isCalculated}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Selected: {selectedTrips.length} trip(s)
              {selectedTrips.length > 0 && (
                <span className="ml-2 text-blue-600">
                  ({advanceDetails.length} advances, {expenseDetails.length} expenses loaded)
                </span>
              )}
            </p>
          </div>

          {/* KM Inputs */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Kilometer Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Old KM</label>
                <input
                  type="number"
                  value={oldKM}
                  onChange={(e) => setOldKM(Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New KM</label>
                <input
                  type="number"
                  value={newKM}
                  onChange={(e) => setNewKM(Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate per KM</label>
                <input
                  type="number"
                  step="0.1"
                  value={perKMRate}
                  onChange={(e) => setPerKMRate(Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous Balance (Pichla)</label>
                <input
                  type="number"
                  value={pichla}
                  onChange={(e) => setPichla(Number(e.target.value))}
                  className="input"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Service KM</label>
                <input
                  type="number"
                  value={nextServiceKM}
                  onChange={(e) => setNextServiceKM(Number(e.target.value))}
                  className="input"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving || selectedTrips.length === 0 || oldKM >= newKM}
              className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Calculation'}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={selectedTrips.length === 0 || oldKM >= newKM}
              className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className="border-l pl-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <h4 className="font-semibold text-gray-900 mb-4">Live Preview</h4>
          
          <div id="calculation-preview" className="bg-white border-2 border-black" style={{ fontSize: '10px' }}>
            {/* Header */}
            <div className="border-b-2 border-black">
              <div className="flex items-start justify-between p-2 border-b-2 border-black">
                <div className="flex-1">
                  <h2 className="text-sm font-bold mb-1">Bombay Ultranchal Tempo Service</h2>
                  <p style={{ fontSize: '9px' }}><span className="font-semibold">Address :</span> Building No. C13, Gala No.01, Parasnath Complex,</p>
                  <p style={{ fontSize: '9px' }}>Dapoda, Bhiwandi, Dist. Thane 421302. (MH).</p>
                  <p style={{ fontSize: '9px' }} className="mt-1"><span className="font-semibold">Phone No.:</span> 6375916182</p>
                  <p style={{ fontSize: '9px' }}><span className="font-semibold">Email ID:</span> butsbwd@gmail.com</p>
                  <p style={{ fontSize: '9px' }}><span className="font-semibold">State:</span> Maharashtra</p>
                </div>
                <div className="text-right">
                  <img 
                    src="/logo.jpg" 
                    alt="BUTS Logo" 
                    className="w-20 h-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="border-4 border-blue-600 rounded-full px-3 py-1" style={{ display: 'none' }}>
                    <span className="text-lg font-bold text-blue-600">BUTS</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 p-2 border-b-2 border-black" style={{ fontSize: '9px' }}>
                <div>
                  <p><span className="font-semibold">Vehicle No :-</span> {selectedVehicle?.vehicleNumber || 'N/A'}</p>
                  <p><span className="font-semibold">Date :-</span> {formatDate(new Date())}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Driver Name :-</span> {driver.fullName}</p>
                  <p><span className="font-semibold">Dr.Contact No</span></p>
                </div>
              </div>

              {/* Combined Table - Advances and Expenses Side by Side */}
              <div className="p-0">
                <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
                  <thead>
                    <tr className="border-2 border-black">
                      <th className="border-r border-black py-1 px-1 text-center" style={{ width: '8%' }}>Sr<br/>No</th>
                      <th className="border-r border-black py-1 px-1 text-center" style={{ width: '20%' }}>Date</th>
                      <th className="border-r border-black py-1 px-1 text-center" style={{ width: '15%' }}>Amount</th>
                      <th className="border-r-2 border-black py-1 px-1 text-center" style={{ width: '15%' }}>Mehod</th>
                      <th className="border-r border-black py-1 px-1 text-center bg-red-600 text-white font-bold" style={{ width: '8%' }}>Sr<br/>No</th>
                      <th className="border-r border-black py-1 px-1 text-center" style={{ width: '15%' }}>Amount</th>
                      <th className="border-black py-1 px-1 text-center" style={{ width: '19%' }}>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const advance = advanceDetails[idx];
                      const expense = expenseDetails[idx];
                      return (
                        <tr key={idx} className="border border-black">
                          <td className="border-r border-black py-1 px-1 text-center">{idx + 1}</td>
                          <td className="border-r border-black py-1 px-1 text-center">
                            {advance ? formatDate(advance.date) : ''}
                          </td>
                          <td className="border-r border-black py-1 px-1 text-right">
                            {advance ? advance.amount.toFixed(0) : ''}
                          </td>
                          <td className="border-r-2 border-black py-1 px-1 text-center">
                            {advance ? advance.method : ''}
                          </td>
                          <td className="border-r border-black py-1 px-1 text-center bg-red-600 text-white font-bold">
                            {idx + 1}
                          </td>
                          <td className="border-r border-black py-1 px-1 text-right">
                            {expense ? expense.amount.toFixed(0) : ''}
                          </td>
                          <td className="border-black py-1 px-1 text-center">
                            {expense ? expense.remark || expense.category : ''}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-2 border-black bg-gray-200">
                      <td colSpan="2" className="border-r border-black py-1 px-1 text-center font-bold">Total</td>
                      <td className="border-r-2 border-black py-1 px-1 text-right font-bold">{totalAdvances.toFixed(0)}</td>
                      <td className="border-r-2 border-black py-1 px-1"></td>
                      <td className="border-r border-black py-1 px-1 text-center font-bold bg-red-600 text-white">Total</td>
                      <td colSpan="2" className="border-black py-1 px-1 text-right font-bold">{totalExpenses.toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Kilometer Calculation */}
              <div className="p-2 border-t-2 border-black">
                <h3 className="font-bold text-center mb-2" style={{ fontSize: '11px' }}>Kilometer Calculation</h3>
                <div className="max-w-md mx-auto">
                  <table className="w-full" style={{ fontSize: '10px' }}>
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="py-0.5 font-semibold">New KM :-</td>
                        <td className="py-0.5 text-right">{newKM}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="py-0.5 font-semibold">Old KM</td>
                        <td className="py-0.5 text-right" style={{ textDecoration: 'underline' }}>{oldKM}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="py-0.5 font-bold">Total KM</td>
                        <td className="py-0.5 text-right font-bold" style={{ textDecoration: 'underline' }}>{totalKM}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="py-0.5 font-bold">KM {perKMRate}</td>
                        <td className="py-0.5 text-right font-bold">{kmValue.toFixed(1)}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="py-0.5 font-semibold">Kharcha</td>
                        <td className="py-0.5 text-right">{totalExpenses.toFixed(0)}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="py-0.5 font-semibold">Pichla</td>
                        <td className="py-0.5 text-right">{pichla}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="py-0.5 font-bold">Total</td>
                        <td className="py-0.5 text-right font-bold">{total.toFixed(1)}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="py-0.5 font-bold">Advance</td>
                        <td className="py-0.5 text-right font-bold" style={{ textDecoration: 'underline' }}>{totalAdvances.toFixed(0)}</td>
                      </tr>
                      <tr className="border-b-2 border-black bg-yellow-100">
                        <td className="py-0.5 font-bold">Trip</td>
                        <td className="py-0.5 text-right font-bold">{due.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
