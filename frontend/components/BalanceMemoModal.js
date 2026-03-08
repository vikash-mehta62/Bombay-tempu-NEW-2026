'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';

export default function BalanceMemoModal({ 
  isOpen, 
  onClose, 
  clientData, 
  tripData,
  onSubmit,
  clientPayments = [],
  clientExpenses = []
}) {
  const memoRef = useRef(null);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    vehicleNumber: '',
    from: '',
    to: '',
    freight: 0,
    advance: 0,
    detention: 0,
    unloadingCharge: 0,
    totalPayable: 0,
    remarks: ''
  });

  const convertToDisplayDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB');
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  useEffect(() => {
    if (clientData && tripData) {
      const freight = clientData.clientRate || 0;
      const clientId = clientData.clientId?._id;
      
      const totalAdvance = clientPayments
        .filter(payment => payment.clientId === clientId || payment.clientId?._id === clientId)
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);
      
      // Group expenses by type
      const expensesByType = {};
      const filteredExpenses = clientExpenses.filter(expense => 
        expense.clientId === clientId || expense.clientId?._id === clientId
      );
      
      filteredExpenses.forEach(expense => {
        const type = expense.expenseType || 'Other';
        if (!expensesByType[type]) {
          expensesByType[type] = 0;
        }
        expensesByType[type] += expense.amount || 0;
      });
      
      const totalExpenses = Object.values(expensesByType).reduce((sum, amt) => sum + amt, 0);
      
      // Build expense remark text
      const expenseRemark = Object.entries(expensesByType)
        .map(([type, amount]) => `${type}: ₹${amount}`)
        .join(', ');
      
      const detention = totalExpenses; // Put total expenses in detention field
      // Total Payable = (Freight + Detention) - Advance
      const totalPayable = (freight + detention) - totalAdvance;

      setFormData({
        invoiceNumber: tripData.tripNumber || '',
        date: new Date().toISOString().split('T')[0],
        customerName: clientData.clientId?.fullName || '',
        vehicleNumber: tripData.vehicleId?.vehicleNumber || '',
        from: clientData.originCity?.cityName || '',
        to: clientData.destinationCity?.cityName || '',
        freight: freight,
        advance: totalAdvance,
        detention: detention, // Total expenses
        unloadingCharge: 0, // Not used anymore
        expensesByType: expensesByType,
        totalPayable: totalPayable,
        remarks: expenseRemark || 'Remark - Dication Charge ₹1000 / Per Day'
      });
    }
  }, [clientData, tripData, clientPayments, clientExpenses, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (['freight', 'advance', 'detention'].includes(name)) {
        const freight = parseFloat(name === 'freight' ? value : updated.freight) || 0;
        const advance = parseFloat(name === 'advance' ? value : updated.advance) || 0;
        const detention = parseFloat(name === 'detention' ? value : updated.detention) || 0;
        // Total Payable = (Freight + Detention) - Advance
        updated.totalPayable = (freight + detention) - advance;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(formData);
    }
    onClose();
  };

  const downloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = memoRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 210;
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const ratio = canvas.height / canvas.width;
      const contentHeight = contentWidth * ratio;

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save(`Balance_Memo_${formData.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('PDF error:', error);
      alert('Failed to generate PDF');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="bg-gray-100 p-6 border-b">
          <div ref={memoRef} className="mx-auto w-full max-w-[850px] bg-white border-2 border-[#1a1a1a] shadow-lg">
            {/* Header - Blance Memo */}
            <div className="border-b-2 border-[#1a1a1a] bg-[#d6dce4] px-4 py-2 text-center">
              <h1 className="text-lg font-bold text-[#1a1a1a] underline">Blance Memo</h1>
            </div>

            {/* Company Name */}
            <div className="border-b-2 border-[#1a1a1a] px-4 py-2 text-center">
              <h2 className="text-xl font-bold text-[#1a1a1a] tracking-wide">BOMBAY UTTRANCHAL TEMPO SERVICE</h2>
            </div>

            {/* Address & Contact Info */}
            <div className="border-b-2 border-[#1a1a1a] px-4 py-2 space-y-0.5">
              <p className="text-[13px] text-[#1a1a1a]">
                <span className="font-bold">Address :</span> Building No. C13, Gala No.01, Parasnath Complex, Dapoda, Bhiwandi, Dist. Thane 421302. (MH).
              </p>
              <p className="text-[13px] text-[#1a1a1a] font-bold">PAN OF SUPPLIER:- BDJPK0529D</p>
              <p className="text-[13px] text-[#1a1a1a] font-bold">MOB. OF SUPPLIER:- 9022223698</p>
            </div>

            {/* Customer Name & Invoice Row */}
            <div className="grid grid-cols-[1fr_auto] border-b-2 border-[#1a1a1a]">
              <div className="border-r-2 border-[#1a1a1a] bg-[#d6dce4] px-3 py-1.5">
                <p className="text-[13px] text-[#1a1a1a]">
                  <span className="font-bold">CUSTOMERNAME:-</span>{formData.customerName}
                </p>
              </div>
              <div className="bg-[#d6dce4] px-3 py-1.5 min-w-[200px]">
                <p className="text-[13px] text-[#1a1a1a] font-bold">INVOICE NO :-{formData.invoiceNumber}</p>
              </div>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-[1fr_1fr] border-b-2 border-[#1a1a1a]">
              {/* Left Side - Vehicle & Freight Details */}
              <div className="border-r-2 border-[#1a1a1a]">
                {/* Vehicle No */}
                <div className="grid grid-cols-[140px_1fr] border-b border-[#c0c0c0] px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a] font-bold">Vehicle No</span>
                  <span className="text-[13px] text-[#1a1a1a]">{formData.vehicleNumber}</span>
                </div>

                {/* Fright */}
                <div className="grid grid-cols-[140px_1fr] border-b border-[#c0c0c0] px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a] font-bold">Fright</span>
                  <span className="text-[13px] text-[#1a1a1a]">{formData.freight}</span>
                </div>

                {/* Advance */}
                <div className="grid grid-cols-[140px_1fr] border-b border-[#c0c0c0] px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a] font-bold">Advance</span>
                  <span className="text-[13px] text-[#1a1a1a]">{formData.advance}</span>
                </div>

                {/* Detention */}
                <div className="grid grid-cols-[140px_1fr] border-b border-[#c0c0c0] px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a] font-bold">Detention</span>
                  <span className="text-[13px] text-[#1a1a1a]">{formData.detention}</span>
                </div>

                {/* Total Paybal Amt */}
                <div className="grid grid-cols-[140px_1fr] px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a] font-bold">Total Paybal Amt.</span>
                  <span className="text-[13px] text-[#1a1a1a] font-bold">{formData.totalPayable}</span>
                </div>
              </div>

              {/* Right Side - From/To */}
              <div>
                {/* From */}
                <div className="grid grid-cols-[80px_1fr] border-b border-[#c0c0c0] px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a] font-bold">From</span>
                  <span className="text-[13px] text-[#1a1a1a] text-right pr-4">{formData.from}</span>
                </div>

                {/* TO */}
                <div className="grid grid-cols-[80px_1fr] border-b border-[#c0c0c0] px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a] font-bold">TO</span>
                  <span className="text-[13px] text-[#1a1a1a] text-right pr-4">{formData.to}</span>
                </div>

                {/* Empty row for advance alignment */}
                <div className="border-b border-[#c0c0c0] px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a]">&nbsp;</span>
                </div>

                {/* Unloading Charge value aligned with detention row */}
                <div className="border-b border-[#c0c0c0] px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a]">&nbsp;</span>
                </div>

                {/* Empty space for total */}
                <div className="px-3 py-1">
                  <span className="text-[13px] text-[#1a1a1a]">&nbsp;</span>
                </div>
              </div>
            </div>

            {/* Remark Row */}
            <div className="border-b-2 border-[#1a1a1a] bg-[#d6dce4] px-4 py-1.5 text-center">
              <p className="text-[13px] text-[#1a1a1a] font-bold">
                {formData.remarks || 'Remark - Dication Charge ₹1000 / Per Day'}
              </p>
            </div>

            {/* Bank Details & Authorized Sign */}
            <div className="grid grid-cols-[1fr_1fr]">
              {/* Left - Bank Details */}
              <div className="border-r-2 border-[#1a1a1a] px-3 py-2 space-y-0.5">
                <div className="flex gap-2">
                  <span className="text-[13px] text-[#1a1a1a] font-bold whitespace-nowrap">BANK NAME :</span>
                  <span className="text-[13px] text-[#1a1a1a]">HDFC Bank</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[13px] text-[#1a1a1a] font-bold whitespace-nowrap">A/C No :-</span>
                  <span className="text-[13px] text-[#1a1a1a]">50200006579916</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[13px] text-[#1a1a1a] font-bold whitespace-nowrap">IFSC Code :-</span>
                  <span className="text-[13px] text-[#1a1a1a]">HDFC000928 Mankoli Branch</span>
                </div>
              </div>

              {/* Right - Authorized Sign */}
              <div className="px-3 py-2 flex flex-col justify-between">
                <p className="text-[13px] text-[#1a1a1a] font-bold">FOR :- Bombay Uttranchal Tempo Service</p>
                <div className="border border-[#1a1a1a] px-2 py-1 mt-1 inline-block self-start">
                  <span className="text-[13px] text-[#1a1a1a] font-bold">Authorized Sign.</span>
                </div>
                {/* Signature area */}
                <div className="flex justify-end items-end mt-2 pr-4 pb-1">
                  <svg width="100" height="40" viewBox="0 0 100 40" className="text-[#3a3a3a]" aria-label="Authorized signature">
                    <path d="M10,30 Q20,5 35,25 T55,20 Q65,15 70,25 T85,20 Q90,15 95,25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M60,28 Q70,32 80,28 Q85,26 90,30" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <button onClick={downloadPDF} className="mt-4 mx-auto flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-600">Create Balance Memo - {clientData?.clientId?.fullName}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <p className="text-sm text-gray-500 mb-4">Generate a balance memo showing payment status for this client</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Customer Name *</label>
                <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="input" required />
              </div>
              <div>
                <label className="label">Invoice Number *</label>
                <input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} className="input" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Date *</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" required />
              </div>
              <div className="col-span-2">
                <label className="label">Vehicle Number *</label>
                <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} className="input" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">From *</label>
                <input type="text" name="from" value={formData.from} onChange={handleChange} className="input" required />
              </div>
              <div>
                <label className="label">To *</label>
                <input type="text" name="to" value={formData.to} onChange={handleChange} className="input" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Freight (₹) *</label>
                <input type="number" name="freight" value={formData.freight} onChange={handleChange} className="input" required />
              </div>
              <div>
                <label className="label">Advance (₹) *</label>
                <input type="number" name="advance" value={formData.advance} onChange={handleChange} className="input" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Detention (₹) *</label>
                <input type="number" name="detention" value={formData.detention} onChange={handleChange} className="input bg-gray-50" title="Auto-calculated from client expenses" readOnly />
                <p className="text-xs text-gray-500 mt-1">Total of all client expenses</p>
              </div>
              <div>
                <label className="label">Total Payable Amount (₹)</label>
                <input type="number" name="totalPayable" value={formData.totalPayable} className="input bg-green-50 text-green-700 font-bold text-lg" readOnly />
                <p className="text-xs text-gray-500 mt-1">Formula: (Freight + Detention) - Advance</p>
              </div>
            </div>

            <div>
              <label className="label">Remark / Dication Charge</label>
              <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="input" rows="3" placeholder="e.g., Dication Charge ₹1000 / Per Day"></textarea>
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">Cancel</button>
              <button type="submit" className="flex-1 btn bg-green-600 text-white hover:bg-green-700">Save Balance Memo</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
