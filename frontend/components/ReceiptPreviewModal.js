'use client';

import { useRef } from 'react';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export default function ReceiptPreviewModal({ trip, fleetOwner, expenses, advances, onClose }) {
  const receiptRef = useRef(null);
  
  const formatCurrency = (amount) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  console.log(trip)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate all financial values
const totalFreight = trip.clients?.reduce(
  (sum, c) => sum + (c.truckHireCost || 0),
  0
) || 0;  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalAdvances = advances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
  
  // Get commission and balance POD from trip
  const commission = trip.commissionAmount || 0;
  const balancePOD = trip.podBalance || 0;
  
  // Calculate Total Fleet Owner Payment (TruckHireCost + Expenses)
  const totalFleetOwnerPayment = totalFreight + totalExpenses;
  
  // Calculate Pending Balance - Image wala formula
  // Pending = (TruckHireCost + Expenses) - Commission - POD - Advances
const pendingBalance =
  totalFleetOwnerPayment
  - commission
  - balancePOD
  - totalAdvances;  
  // Calculate Final Amount (same as Pending Balance)
const finalAmount =
  totalFleetOwnerPayment
  - commission
  - balancePOD
  - totalAdvances;
  const handleDownload = async () => {
    try {
      if (!receiptRef.current) {
        toast.error('Receipt not ready');
        return;
      }

      toast.info('Generating PDF...');

      // Capture the receipt HTML as canvas
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Download PDF
      const fileName = `Receipt_${trip.tripNumber}_${fleetOwner?.fullName || 'FleetOwner'}.pdf`;
      pdf.save(fileName);
      
      toast.success('Receipt downloaded successfully');
      onClose();
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Receipt Preview</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 bg-gray-50">
          <div ref={receiptRef} className="bg-white border-2 border-gray-300 p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-3">
              <p className="text-xs mb-1 font-semibold">श्री गणेशाय नमः</p>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold">Mohit Choudhary</p>
                <p className="text-xs font-bold">MOB : 6375916182</p>
              </div>
              <h1 className="text-xl font-bold mb-1">Bombay Uttranchal Tempo Service</h1>
              <p className="text-[10px]">Building No.C13, Gala No.01, Parasnath Complex, Dapoda,</p>
              <p className="text-[10px]">Dapoda, Bhiwandi, Dist. Thane 421302 (MH)</p>
            </div>

            {/* Fleet Owner Section */}
            <div className="bg-blue-100 px-2 py-1 font-bold text-xs border-t-2 border-b-2 border-gray-300 mb-1">
              Fleet Owner
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
              <div className="font-semibold">Owner Name : {fleetOwner?.fullName || 'N/A'}</div>
              <div className="text-right font-semibold">Vehicle No : {trip.vehicleId?.vehicleNumber || 'N/A'}</div>
              <div className="font-semibold">Mob No : {fleetOwner?.contact || 'N/A'}</div>
              <div className="text-right font-semibold">Trip No : {trip.tripNumber || 'N/A'}</div>
            </div>

            {/* Client Details */}
            <div className="border-t-2 border-gray-300 mb-1"></div>
            <div className="bg-blue-100 px-2 py-1 grid grid-cols-5 gap-2 text-[10px] font-bold border-b border-gray-300">
              <div>Date</div>
              <div>Client Name</div>
              <div>Fight</div>
              <div>From</div>
              <div>To</div>
            </div>
            {trip.clients && trip.clients.length > 0 ? (
              trip.clients.map((client, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 text-[10px] py-1 border-b border-gray-200 font-semibold">
                  <div>{formatDate(client.loadDate)}</div>
                  <div>{client.clientId?.fullName || client.clientId?.companyName || 'N/A'}</div>
                  <div>₹{client.truckHireCost || 0}</div>
                  <div>{client.originCity?.cityName || '-'}</div>
                  <div>{client.destinationCity?.cityName || '-'}</div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-5 gap-2 text-[10px] py-1 border-b border-gray-200 font-semibold">
                <div>N/A</div>
                <div>No clients</div>
                <div>₹0</div>
                <div>-</div>
                <div>-</div>
              </div>
            )}
            <div className="grid grid-cols-5 gap-2 text-xs py-1 font-bold border-t-2 border-gray-300">
              <div></div>
              <div>Total</div>
              <div>₹{totalFreight}</div>
              <div></div>
              <div></div>
            </div>

            {/* Expenses Section */}
            <div className="bg-blue-100 px-2 py-1 font-bold text-xs border-t-2 border-b-2 border-gray-300 mt-2 mb-1 text-center">
              Total Expances
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold border-b border-gray-300 py-1">
              <div>Date</div>
              <div>Expance Resions</div>
              <div>Amount</div>
            </div>
            {expenses && expenses.length > 0 ? (
              expenses.map((expense, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 text-[10px] py-1 border-b border-gray-200 font-semibold">
                  <div>{formatDate(expense.date)}</div>
                  <div>{expense.description || expense.expenseType || 'N/A'}</div>
                  <div>₹{expense.amount || 0}</div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-3 gap-2 text-[10px] py-1 border-b border-gray-200 font-semibold">
                <div>N/A</div>
                <div>No expenses</div>
                <div>₹0</div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-xs py-1 font-bold border-t-2 border-gray-300">
              <div></div>
              <div>Total</div>
              <div>₹{totalExpenses}</div>
            </div>

            {/* Transaction Details */}
            <div className="bg-blue-100 px-2 py-1 font-bold text-xs border-t-2 border-b-2 border-gray-300 mt-2 mb-1 text-center">
              Transaction Details
            </div>
            <div className="grid grid-cols-5 gap-2 text-[10px] font-bold border-b border-gray-300 py-1">
              <div>Sr.No</div>
              <div>Date</div>
              <div>Method</div>
              <div>Reference</div>
              <div>Amount</div>
            </div>
            {advances && advances.length > 0 ? (
              advances.map((advance, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 text-[10px] py-1 border-b border-gray-200 font-semibold">
                  <div>{index + 1}.</div>
                  <div>{formatDate(advance.date)}</div>
                  <div className="uppercase">{advance.paymentMethod || 'Cash'}</div>
                  <div>{advance.description || 'N/A'}</div>
                  <div>₹{advance.amount || 0}</div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-5 gap-2 text-[10px] py-1 border-b border-gray-200 font-semibold">
                <div>1.</div>
                <div>N/A</div>
                <div>N/A</div>
                <div>No advances</div>
                <div>₹0</div>
              </div>
            )}
            <div className="grid grid-cols-5 gap-2 text-xs py-1 font-bold border-t-2 border-gray-300">
              <div></div>
              <div></div>
              <div></div>
              <div>Total</div>
              <div>₹{totalAdvances}</div>
            </div>

            {/* Final Summary */}
            <div className="mt-3 border-t-2 border-gray-300 pt-2">
              <h3 className="font-bold text-xs mb-2">Final Summary</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Total Fright / Expance</span>
                  <span>₹{totalFleetOwnerPayment}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Expance</span>
                  <span>₹{totalExpenses}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Commission</span>
                  <span>₹{commission}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Blance POD</span>
                  <span>₹{balancePOD}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Paid</span>
                  <span>₹{totalAdvances}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t-2 border-gray-300 pt-1 mt-1">
                  <span>Final Amount</span>
                  <span>₹{finalAmount}</span>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="mt-4 text-right">
              <p className="font-bold text-xs">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
