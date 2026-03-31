'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';

export default function CollectionMemoModal({ 
  isOpen, 
  onClose, 
  clientData, 
  tripData,
  onSubmit,
  clientPayments = [], // Add client payments prop
  editData = null, // Add edit data prop
  viewOnly = false // Add view only mode
}) {
  console.log('CollectionMemoModal rendered with:', { isOpen, editData, clientData });
  
  const memoRef = useRef(null);
  const [formData, setFormData] = useState({
    collectionNumber: '',
    date: new Date().toISOString().split('T')[0], // Use YYYY-MM-DD format for date input
    msName: '',
    lorryNumber: '',
    from: '',
    to: '',
    rate: '',
    freight: '',
    advance: '',
    balance: '',
    weight: '',
    guarantee: ''
  });

  // Helper function to convert date formats
  const convertToInputDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // If already in YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    
    // If in DD/MM/YYYY format
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }
    
    return new Date().toISOString().split('T')[0];
  };
  
  const convertToDisplayDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB');
    
    // If in YYYY-MM-DD format, convert to DD/MM/YYYY
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    
    return dateStr;
  };

  useEffect(() => {
    console.log('Modal useEffect triggered - editData:', editData);
    console.log('Modal useEffect triggered - clientData:', clientData);
    
    if (editData) {
      // If editing, populate with existing data
      console.log('Setting form data from editData');
      setFormData({
        collectionNumber: editData.collectionNumber || '',
        date: convertToInputDate(editData.date),
        msName: editData.msName || '',
        lorryNumber: editData.lorryNumber || '',
        from: editData.from || '',
        to: editData.to || '',
        rate: editData.rate || '',
        freight: editData.freight || '',
        advance: editData.advance || '',
        balance: editData.balance || '',
        weight: editData.weight || '',
        guarantee: editData.guarantee || ''
      });
    } else if (clientData && tripData && isOpen) {
      console.log('Setting form data from clientData');
      const freight = clientData.clientRate || 0;
      
      // Calculate advance from client payments
      const clientId = clientData.clientId?._id;
      const totalAdvance = clientPayments
        .filter(payment => payment.clientId === clientId || payment.clientId?._id === clientId)
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);
      
      const balance = freight - totalAdvance;

      setFormData({
        collectionNumber: tripData.tripNumber || `TRP${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString().split('T')[0],
        msName: clientData.clientId?.fullName || '',
        lorryNumber: tripData.vehicleId?.vehicleNumber || '',
        from: clientData.originCity?.cityName || '',
        to: clientData.destinationCity?.cityName || '',
        rate: `₹ ${freight.toLocaleString('en-IN')}`,
        freight: freight.toString(),
        advance: totalAdvance.toString(),
        balance: balance.toString(),
        weight: '0 tons',
        guarantee: ''
      });
    }
  }, [clientData, tripData, clientPayments, editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate balance when freight or advance changes
      if (name === 'freight' || name === 'advance') {
        const freight = parseFloat(name === 'freight' ? value : updated.freight) || 0;
        const advance = parseFloat(name === 'advance' ? value : updated.advance) || 0;
        updated.balance = (freight - advance).toString();
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      // Convert date to display format before submitting
      const submitData = {
        ...formData,
        date: convertToDisplayDate(formData.date)
      };
      await onSubmit(submitData);
    }
    onClose();
  };

  const downloadPDF = async () => {
    try {
      // Dynamically import html2canvas and jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = memoRef.current;
      if (!element) return;

      // Capture the memo as canvas with better quality
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      // Create PDF with proper margins
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Add margins (10mm on each side)
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      
      // Calculate height to maintain aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgHeight / imgWidth;
      const contentHeight = contentWidth * ratio;
      
      // Center the content
      const xOffset = margin;
      const yOffset = margin;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, contentWidth, contentHeight);
      pdf.save(`Collection_Memo_${formData.collectionNumber}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* PDF Preview Section */}
        <div className="bg-gray-100 p-6 border-b">
          <div ref={memoRef} className="mx-auto w-full max-w-[794px] bg-white text-black border-2 border-black p-3 box-border">
            {/* Header row with names and phone numbers */}
            <div className="text-[11pt] leading-[13pt]">
              <div className="flex items-center justify-between px-1">
                <span>Gopiram</span>
                <span className="font-sans">श्री गणेशाय नमः</span>
                <span>Mob: 9022223698</span>
              </div>
              <div className="px-1 flex justify-between">
                <span>Mohit</span>
                <img src="/logo.jpg" alt="BUTS" className="h-10 mt-1" />
                <span>6375916182</span>
              </div>
            </div>

            {/* Company Name */}
            <h1 className="mt-1 text-center font-bold text-[18pt]">
              Bombay Uttranchal Tempo Service
            </h1>
          

            {/* Services / Address */}
            <div className="mt-1 text-[11pt]">
            
              <p className="text-center font-bold">
                Add: <i>Building No. C13, Gala No.01, Parasnath Complex,</i>
              </p>
              <p className="text-center">Dapoda, Bhiwandi, Dist. Thane 421302.</p>
            </div>

            {/* Collection memo bar */}
            <div className="mt-2 text-[11pt] leading-[13pt]">
              <div className="flex items-center justify-between pr-3">
                <span>Collection No : <span className="font-bold">{formData.collectionNumber}</span></span>
                <span className="font-bold">COLLECTION MEMO</span>
                <span>Date <span className="font-bold">{convertToDisplayDate(formData.date)}</span></span>
              </div>
            </div>

            {/* M/s */}
            <div className="mt-1 text-[11pt] leading-[13pt] pl-4">
              <span>M/s. </span>
              <span className="inline-block min-w-[520px] border-b border-black align-baseline pb-[6px] font-bold">
                {formData.msName}
              </span>
            </div>

            {/* Dear / Instruction */}
            <div className="mt-1 text-[11pt] leading-[13pt] pl-4">
              <p>Dear Sir,</p>
              <p className="pl-12">As Per Your Instruction We Are Sending Herewith Our</p>
            </div>

            {/* Lorry / From-To */}
            <div className="mt-2 text-[11pt] leading-[14pt] pl-5 pr-7">
              <p>
                Lorry No{' '}
                <span className="inline-block min-w-[220px] border-b border-black align-baseline pb-[6px] font-bold">
                  {formData.lorryNumber}
                </span>{' '}
                For The Collection Of Your Goods To Be Despatched From{' '}
                <span className="inline-block min-w-[160px] border-b border-black align-baseline pb-[6px] font-bold">
                  {formData.from}
                </span>{' '}
                To{' '}
                <span className="inline-block min-w-[160px] border-b border-black align-baseline pb-[6px] font-bold">
                  {formData.to}
                </span>.
              </p>
            </div>

            {/* Rate / Fright */}
            <div className="mt-2 text-[11pt] leading-[13pt] pl-5">
              <p className="flex gap-6">
                <span>
                  Rate{' '}
                  <span className="inline-block min-w-[180px] border-b border-black align-baseline pb-[6px] font-bold">
                    {formData.rate}
                  </span>
                </span>
                <span>
                  Fright{' '}
                  <span className="inline-block min-w-[140px] border-b border-black align-baseline pb-[6px] font-bold">
                    {formData.freight}
                  </span>
                </span>
              </p>
            </div>

            {/* Weight / Adcance */}
            <div className="mt-1 text-[11pt] leading-[13pt] pl-5">
              <p className="flex gap-6">
                <span>
                  Weight{' '}
                  <span className="inline-block min-w-[200px] border-b border-black align-baseline pb-[6px] font-bold">
                    {formData.weight}
                  </span>
                </span>
                <span>
                  Adcance{' '}
                  <span className="inline-block min-w-[140px] border-b border-black align-baseline pb-[6px] font-bold">
                    {formData.advance}
                  </span>
                </span>
              </p>
            </div>

            {/* Guarantee / Blance */}
            <div className="mt-1 text-[11pt] leading-[13pt] pl-5">
              <p className="flex gap-6">
                <span>
                  Guarantee{' '}
                  <span className="inline-block min-w-[200px] border-b border-black align-baseline pb-[6px] font-bold">
                    {formData.guarantee}
                  </span>
                </span>
                <span>
                  Blance{' '}
                  <span className="inline-block min-w-[140px] border-b border-black align-baseline pb-[6px] font-bold">
                    {formData.balance}
                  </span>
                </span>
              </p>
            </div>

            {/* PAN / Faithfully */}
            <div className="mt-3 text-[11pt] leading-[13pt] px-5">
              <div className="flex items-center justify-between">
                <span>PAN CARD No. BDJPK0529D</span>
                <span className="font-bold">Your's Faithfully</span>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-2 text-[11pt] leading-[13pt] px-5">
              <p>TERMS :</p>
              <p>* We are not responsible for leakage</p>
              <p className="pl-7">Breakage & consequent damages in Transit.</p>
              <p>* Goods carried at Owner's Risk</p>
              <p>* Pleased check lorry engine, chases and all necessary documents.</p>
            </div>

            {/* Bank */}
            <div className="mt-1 text-[11pt] leading-[13pt] px-5">
              <p className="font-bold">HDFC - A/c. 50200006579916</p>
              <p className="font-bold">IFSC HDFC - 0009218 - Mankoli Branch</p>
            </div>

            {/* Footer */}
            <div className="mt-3 text-[11pt] leading-[13pt] text-right pr-5">
              For Bombay Uttranchal Tempo Service
            </div>
          </div>

          <button
            onClick={downloadPDF}
            className="mt-4 mx-auto flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Form Section */}
        {!viewOnly && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-600">
                {editData ? 'Edit Collection Memo' : 'Create Collection Memo'} - {clientData?.clientId?.fullName}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Collection No*</label>
                <input
                  type="text"
                  name="collectionNumber"
                  value={formData.collectionNumber}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Date*</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">M/s.*</label>
                <input
                  type="text"
                  name="msName"
                  value={formData.msName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Party name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Lorry No*</label>
                <input
                  type="text"
                  name="lorryNumber"
                  value={formData.lorryNumber}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">From*</label>
                  <input
                    type="text"
                    name="from"
                    value={formData.from}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">To*</label>
                  <input
                    type="text"
                    name="to"
                    value={formData.to}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Rate*</label>
                <input
                  type="text"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  className="input"
                  placeholder="41,500"
                  required
                />
              </div>
              <div>
                <label className="label">Freight (₹)*</label>
                <input
                  type="number"
                  name="freight"
                  value={formData.freight}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Advance (₹)*</label>
                <input
                  type="number"
                  name="advance"
                  value={formData.advance}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Balance (₹)*</label>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  className="input bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="label">Weight*</label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="input"
                  placeholder="0 tons"
                  required
                />
              </div>
              <div>
                <label className="label">Guarantee</label>
                <input
                  type="text"
                  name="guarantee"
                  value={formData.guarantee}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn bg-blue-600 text-white hover:bg-blue-700"
              >
                {editData ? 'Update Memo' : 'Save Memo'}
              </button>
            </div>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
