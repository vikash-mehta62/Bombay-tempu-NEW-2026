'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Plus, Trash2, Save, List } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LRPage() {
  const previewRef = useRef();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lrId = searchParams.get('id');
  const [loading, setLoading] = useState(false);
const [formData, setFormData] = useState({
  companyName: 'MK LOGISTICS',
  officeAddress: 'Corp Office : G Floor Shop No. 13 City Star Mall Parijat Chowk, Hisar, Haryana - 125001',
  mob: '6375916182',
  gstNo: '06HNTEM3568J1Z4',

  bookingType: '',
  deliveryType: '',
  serviceType: '',
  issueType: '',

  customerName: '',

  consignorName: '',
  consignorAddress: '',
  consignorPin: '',
  consignorMob: '',
  consignorGst: '',
  consignorCode: '',

  consigneeName: '',
  consigneeAddress: '',
  consigneePin: '',
  consigneeMob: '',
  consigneeCode: '',

  consignmentNo: '',

  from: '',
  to: '',

  items: [
    {
      typeOfPacking: '',
      description: '',
      actualWeight: '',
      chargedWeight: '',
      rate: ''
    },
  
  ],

  noOfPackages: '',

  length: '',
  width: '',
  height: '',

  privateMarks: '',
  declaredValue: '',

  invoices: [
    {
      invoiceNo: '',
      date: '',
      partName: '',
      partNo: '',
      noOfPcs: '',
      ewayBillNo: ''
    }
   
  ],

  freight: '',
  rov: '',
  fodToPay: '',
  fuelSurcharge: '',
  collection: '',
  delCharges: '',
  hamali: '',
  builtyCharges: '',

  sgstPercent: '',
  cgstPercent: '',
  igstPercent: '',

  lrNo: '',
  grnNo: '',
  grnDate: '',

  specialInstruction: 'Do not stack heavy items on top. Deliver during working hours only.',

  preparedBy: 'MOHIT KAREL',

  amountInWords: '',

  rpeType: 'PALLET',
  rpeId: 'RPE123',
  rpeQty: '',
  rpeRemarks: 'Returnable pallets in good condition'
});

  // Load LR data if editing
  useEffect(() => {
    if (lrId) {
      loadLRData();
    }
  }, [lrId]);

  const loadLRData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lrs/${lrId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        toast.error('Failed to load LR data');
      }
    } catch (error) {
      console.error('Load LR error:', error);
      toast.error('Error loading LR data');
    } finally {
      setLoading(false);
    }
  };

  const saveLR = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = lrId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/lrs/${lrId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/lrs`;
      
      const method = lrId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(lrId ? 'LR updated successfully' : 'LR created successfully');
        
        // If new LR, redirect to edit mode with ID
        if (!lrId && data.lr) {
          router.push(`/dashboard/lr?id=${data.lr._id}`);
        }
      } else {
        toast.error(data.message || 'Failed to save LR');
      }
    } catch (error) {
      console.error('Save LR error:', error);
      toast.error('Error saving LR');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (index, arrayName, field, value) => {
    const newArray = [...formData[arrayName]];
    newArray[index][field] = value;
    setFormData(prev => ({ ...prev, [arrayName]: newArray }));
  };

  const addRow = (arrayName, emptyObj) => {
    setFormData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], emptyObj] }));
  };

  const removeRow = (index, arrayName) => {
    if (formData[arrayName].length > 1) {
      const newArray = [...formData[arrayName]];
      newArray.splice(index, 1);
      setFormData(prev => ({ ...prev, [arrayName]: newArray }));
    }
  };

  const calculateSubTotal = () => {
    const fields = ['freight', 'rov', 'fodToPay', 'fuelSurcharge', 'collection', 'delCharges', 'hamali', 'builtyCharges'];
    return fields.reduce((sum, field) => sum + (parseFloat(formData[field]) || 0), 0);
  };

  const calculateGst = (subTotal, percent) => {
    return (subTotal * (parseFloat(percent) || 0)) / 100;
  };

  const numberToWordsIndian = (value) => {
    const num = Math.floor(Number(value) || 0);
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const twoDigits = (n) => {
      if (n < 20) return ones[n];
      return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`.trim();
    };
    const threeDigits = (n) => {
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      if (!hundred) return twoDigits(rest);
      return `${ones[hundred]} Hundred${rest ? ` ${twoDigits(rest)}` : ''}`.trim();
    };
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const rest = num % 1000;
    const parts = [];
    if (crore) parts.push(`${twoDigits(crore)} Crore`);
    if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
    if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
    if (rest) parts.push(threeDigits(rest));
    return parts.join(' ').trim();
  };

  const subTotal = calculateSubTotal();
  const sgstAmount = calculateGst(subTotal, formData.sgstPercent);
  const cgstAmount = calculateGst(subTotal, formData.cgstPercent);
  const igstAmount = calculateGst(subTotal, formData.igstPercent);
  const grandTotal = subTotal + sgstAmount + cgstAmount + igstAmount;
  const amountInWordsDisplay = formData.amountInWords?.trim() || (grandTotal > 0 ? `${numberToWordsIndian(grandTotal)} Only` : '');

  const downloadPDF = async () => {
  try {
    toast.loading('PDF tayar ho raha hai...');

    // Generate filename with FROM, TO, Consignor Name, and Consignment Number
    const cleanString = (str) => (str || '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const filename = `LR_${cleanString(formData.consignmentNo)}_${cleanString(formData.from)}_${cleanString(formData.to)}_${cleanString(formData.consignorName)}.html`;

    let logoBase64 = '';
    try {
      const resp = await fetch('/mk-logo.png');
      const blob = await resp.blob();
      logoBase64 = await new Promise((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {}

    const source = previewRef.current;
    if (!source) return;
    let cloneHTML = source.outerHTML;
    if (logoBase64) {
      cloneHTML = cloneHTML.replace(/src="\/mk-logo\.png"/g, `src="${logoBase64}"`);
    }

    let allCSS = '';
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            allCSS += rule.cssText + '\n';
          });
        } catch (e) {
          if (sheet.href) allCSS += `@import url('${sheet.href}');\n`;
        }
      });
    } catch (e) {}

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${filename}</title>
<style>
${allCSS}
@page {
  size: 297mm 210mm landscape;
  margin: 0 !important;
}
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 297mm !important;
  height: 210mm !important;
  overflow: hidden !important;
  background: white !important;
}
#lr-preview {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 297mm !important;
  height: 210mm !important;
  margin: 0 !important;
  padding: 3mm !important;
  box-shadow: none !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}
.shadow-2xl { box-shadow: none !important; }
</style>
</head>
<body>
${cloneHTML}
<script>
window.onload = function() {
  setTimeout(function() {
    window.print();
    setTimeout(function() { window.close(); }, 1000);
  }, 500);
};
<\/script>
</body>
</html>`;

    toast.dismiss();

    // ✅ Sirf ek naya window — koi iframe nahi
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');

    if (!win) {
      toast.error('Popup blocked hai — browser mein allow karo');
      return;
    }

    toast.success('Print dialog mein "Save as PDF" aur Layout: Landscape select karo');

    setTimeout(() => URL.revokeObjectURL(url), 10000);

  } catch (err) {
    toast.dismiss();
    toast.error('PDF generation fail ho gayi');
    console.error(err);
  }
};

  const Checkbox = ({ label, checked, name, value }) => {
    const handleCheck = () => {
      if (name) {
        setFormData(prev => ({ ...prev, [name]: value || (checked ? '' : label) }));
      }
    };
    return (
      <div className="flex items-center space-x-1 cursor-pointer select-none leading-none" onClick={handleCheck}>
        <div className="w-3.5 h-3.5 border-[1.5px] border-black flex items-center justify-center text-[10px] font-bold leading-none bg-white flex-shrink-0">
          {checked ? '✓' : ''}
        </div>
        <span className="text-[10px] font-bold uppercase whitespace-nowrap leading-none">{label}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 overflow-hidden">
      {/* Left Side: Form */}
      <div className="w-full lg:w-[40%] p-4 overflow-y-auto border-r border-gray-300">
        <div className="flex justify-between items-center mb-4 gap-2">
          <h1 className="text-xl font-bold">{lrId ? 'Edit LR' : 'New LR'}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/lr/list')}
              className="bg-gray-600 text-white px-3 py-2 rounded font-bold hover:bg-gray-700 flex items-center gap-2"
            >
              <List size={16} /> View All
            </button>
            <button
              onClick={saveLR}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} /> {loading ? 'Saving...' : (lrId ? 'Update' : 'Save')}
            </button>
            <button
              onClick={downloadPDF}
              className="bg-blue-600 text-white px-3 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={16} /> PDF
            </button>
          </div>
        </div>

       

        <div className="space-y-4 pb-20">
          <div className="bg-white p-3 rounded shadow-sm">
            <h2 className="text-sm font-bold mb-2 border-b">Consignor Details</h2>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" name="consignorName" value={formData.consignorName} onChange={handleChange} className="p-1 border text-sm" placeholder="Consignor Name" />
              <input type="text" name="consignorCode" value={formData.consignorCode} onChange={handleChange} className="p-1 border text-sm" placeholder="Consignor Code" />
              <textarea name="consignorAddress" value={formData.consignorAddress} onChange={handleChange} className="col-span-2 p-1 border text-sm" placeholder="Address" rows="2" />
              <input type="text" name="consignorPin" value={formData.consignorPin} onChange={handleChange} className="p-1 border text-xs" placeholder="Pin NO" />
              <input type="text" name="consignorMob" value={formData.consignorMob} onChange={handleChange} className="p-1 border text-xs" placeholder="MOB NO" />
              <input type="text" name="consignorGst" value={formData.consignorGst} onChange={handleChange} className="col-span-2 p-1 border text-xs" placeholder="GSTIN No." />
            </div>
          </div>

          <div className="bg-white p-3 rounded shadow-sm">
            <h2 className="text-sm font-bold mb-2 border-b">Consignee Details</h2>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" name="consigneeName" value={formData.consigneeName} onChange={handleChange} className="p-1 border text-sm" placeholder="Consignee Name" />
              <input type="text" name="consigneeCode" value={formData.consigneeCode} onChange={handleChange} className="p-1 border text-sm" placeholder="Consignee Code" />
              <textarea name="consigneeAddress" value={formData.consigneeAddress} onChange={handleChange} className="col-span-2 p-1 border text-sm" placeholder="Address" rows="2" />
              <input type="text" name="consigneePin" value={formData.consigneePin} onChange={handleChange} className="p-1 border text-xs" placeholder="Pin NO" />
              <input type="text" name="consigneeMob" value={formData.consigneeMob} onChange={handleChange} className="p-1 border text-xs" placeholder="MOB NO" />
              <input type="text" name="consigneeGst" value={formData.consigneeGst} onChange={handleChange} className="col-span-2 p-1 border text-xs" placeholder="GSTIN No." />
            </div>
          </div>

          <div className="bg-white p-3 rounded shadow-sm">
            <h2 className="text-sm font-bold mb-2 border-b">Booking Info</h2>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" name="consignmentNo" value={formData.consignmentNo} onChange={handleChange} className="p-1 border text-sm" placeholder="Consignment No" />
              <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="p-1 border text-sm" placeholder="Customer Name" />
              <input type="text" name="from" value={formData.from} onChange={handleChange} className="p-1 border text-sm" placeholder="FROM" />
              <input type="text" name="to" value={formData.to} onChange={handleChange} className="p-1 border text-sm" placeholder="TO" />
              <div className="grid grid-cols-2 gap-2 col-span-2">
                <select name="bookingType" value={formData.bookingType} onChange={handleChange} className="p-1 border text-xs">
                  {['TO PAY', 'PAID', 'TBB', 'BOD'].map(o => <option key={o}>{o}</option>)}
                </select>
                <select name="deliveryType" value={formData.deliveryType} onChange={handleChange} className="p-1 border text-xs">
                  {['GODOWN TO GODOWN', 'FOC'].map(o => <option key={o}>{o}</option>)}
                </select>
                <select name="serviceType" value={formData.serviceType} onChange={handleChange} className="p-1 border text-xs">
                  {['ROAD', 'TRAIN', 'AIR', 'EXPRESS'].map(o => <option key={o}>{o}</option>)}
                </select>
                <select name="issueType" value={formData.issueType} onChange={handleChange} className="p-1 border text-xs">
                  {['ISSUE', 'TRANSFER', 'COLLECTION', 'RETURN'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold">Items</h2>
              <button onClick={() => addRow('items', { typeOfPacking: '', description: '', actualWeight: '', chargedWeight: '', rate: '' })} className="text-blue-600"><Plus size={16} /></button>
            </div>
            {formData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-1 mb-1">
                <input type="text" value={item.typeOfPacking} onChange={(e) => handleArrayChange(idx, 'items', 'typeOfPacking', e.target.value)} className="p-1 border text-[10px]" placeholder="Pkg Type" />
                <input type="text" value={item.description} onChange={(e) => handleArrayChange(idx, 'items', 'description', e.target.value)} className="p-1 border text-[10px]" placeholder="Desc" />
                <input type="text" value={item.actualWeight} onChange={(e) => handleArrayChange(idx, 'items', 'actualWeight', e.target.value)} className="p-1 border text-[10px]" placeholder="Act Wt" />
                <input type="text" value={item.chargedWeight} onChange={(e) => handleArrayChange(idx, 'items', 'chargedWeight', e.target.value)} className="p-1 border text-[10px]" placeholder="Chg Wt" />
                <div className="flex">
                  <input type="text" value={item.rate} onChange={(e) => handleArrayChange(idx, 'items', 'rate', e.target.value)} className="p-1 border text-[10px] w-full" placeholder="Rate" />
                  <button onClick={() => removeRow(idx, 'items')} className="text-red-500 ml-1"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-3 rounded shadow-sm">
            <h2 className="text-sm font-bold mb-2">Dimensions & Charges</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <input type="text" name="noOfPackages" value={formData.noOfPackages} onChange={handleChange} className="w-full p-1 border text-xs" placeholder="No. Pkgs" />
                <div className="grid grid-cols-3 gap-1">
                  <input type="text" name="length" value={formData.length} onChange={handleChange} className="p-1 border text-xs" placeholder="L" />
                  <input type="text" name="width" value={formData.width} onChange={handleChange} className="p-1 border text-xs" placeholder="W" />
                  <input type="text" name="height" value={formData.height} onChange={handleChange} className="p-1 border text-xs" placeholder="H" />
                </div>
                <input type="text" name="privateMarks" value={formData.privateMarks} onChange={handleChange} className="w-full p-1 border text-xs" placeholder="Private Marks" />
                <input type="text" name="declaredValue" value={formData.declaredValue} onChange={handleChange} className="w-full p-1 border text-xs" placeholder="Declared Value" />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <input type="text" name="freight" value={formData.freight} onChange={handleChange} className="p-1 border text-xs" placeholder="Freight" />
                <input type="text" name="rov" value={formData.rov} onChange={handleChange} className="p-1 border text-xs" placeholder="ROV" />
                <input type="text" name="fodToPay" value={formData.fodToPay} onChange={handleChange} className="p-1 border text-xs" placeholder="FOD/To Pay" />
                <input type="text" name="fuelSurcharge" value={formData.fuelSurcharge} onChange={handleChange} className="p-1 border text-xs" placeholder="Fuel" />
                <input type="text" name="collection" value={formData.collection} onChange={handleChange} className="p-1 border text-xs" placeholder="Collection" />
                <input type="text" name="delCharges" value={formData.delCharges} onChange={handleChange} className="p-1 border text-xs" placeholder="Del. Chg" />
                <input type="text" name="hamali" value={formData.hamali} onChange={handleChange} className="p-1 border text-xs" placeholder="Hamali" />
                <input type="text" name="builtyCharges" value={formData.builtyCharges} onChange={handleChange} className="p-1 border text-xs" placeholder="Builty" />
                <input type="text" name="sgstPercent" value={formData.sgstPercent} onChange={handleChange} className="p-1 border text-xs" placeholder="SGST%" />
                <input type="text" name="cgstPercent" value={formData.cgstPercent} onChange={handleChange} className="p-1 border text-xs" placeholder="CGST%" />
                <input type="text" name="igstPercent" value={formData.igstPercent} onChange={handleChange} className="p-1 border text-xs" placeholder="IGST%" />
              </div>
            </div>
            <input type="text" name="amountInWords" value={formData.amountInWords} onChange={handleChange} className="w-full p-1 border text-xs mt-2" placeholder="Amount in Words (optional, auto-calculate hoga)" />
          </div>

          <div className="bg-white p-3 rounded shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold">Invoices</h2>
              <button onClick={() => addRow('invoices', { invoiceNo: '', date: '', partName: '', partNo: '', noOfPcs: '', ewayBillNo: '' })} className="text-blue-600"><Plus size={16} /></button>
            </div>
            {formData.invoices.map((inv, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-1 mb-2 border-b pb-1 last:border-0">
                <input type="text" value={inv.invoiceNo} onChange={(e) => handleArrayChange(idx, 'invoices', 'invoiceNo', e.target.value)} className="p-1 border text-[10px]" placeholder="Inv No" />
                <input type="text" value={inv.date} onChange={(e) => handleArrayChange(idx, 'invoices', 'date', e.target.value)} className="p-1 border text-[10px]" placeholder="Date" />
                <div className="flex">
                  <input type="text" value={inv.ewayBillNo} onChange={(e) => handleArrayChange(idx, 'invoices', 'ewayBillNo', e.target.value)} className="p-1 border text-[10px] w-full" placeholder="E-way No" />
                  <button onClick={() => removeRow(idx, 'invoices')} className="text-red-500 ml-1"><Trash2 size={12} /></button>
                </div>
                <input type="text" value={inv.partName} onChange={(e) => handleArrayChange(idx, 'invoices', 'partName', e.target.value)} className="p-1 border text-[10px]" placeholder="Part Name" />
                <input type="text" value={inv.partNo} onChange={(e) => handleArrayChange(idx, 'invoices', 'partNo', e.target.value)} className="p-1 border text-[10px]" placeholder="Part No" />
                <input type="text" value={inv.noOfPcs} onChange={(e) => handleArrayChange(idx, 'invoices', 'noOfPcs', e.target.value)} className="p-1 border text-[10px]" placeholder="Pcs" />
              </div>
            ))}
          </div>

          <div className="bg-white p-3 rounded shadow-sm">
            <h2 className="text-sm font-bold mb-2 border-b">RPE & Footer</h2>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" name="rpeType" value={formData.rpeType} onChange={handleChange} className="p-1 border text-xs" placeholder="RPE Type" />
              <input type="text" name="rpeId" value={formData.rpeId} onChange={handleChange} className="p-1 border text-xs" placeholder="RPE ID" />
              <input type="text" name="rpeQty" value={formData.rpeQty} onChange={handleChange} className="p-1 border text-xs" placeholder="RPE Qty" />
              <input type="text" name="rpeRemarks" value={formData.rpeRemarks} onChange={handleChange} className="p-1 border text-xs" placeholder="RPE Remarks" />
              <input type="text" name="lrNo" value={formData.lrNo} onChange={handleChange} className="p-1 border text-xs" placeholder="LR No" />
              <input type="text" name="grnNo" value={formData.grnNo} onChange={handleChange} className="p-1 border text-xs" placeholder="GRN No" />
              <input type="text" name="grnDate" value={formData.grnDate} onChange={handleChange} className="p-1 border text-xs" placeholder="GRN Date" />
              <input type="text" name="preparedBy" value={formData.preparedBy} onChange={handleChange} className="p-1 border text-xs" placeholder="Prepared By" />
              <textarea name="specialInstruction" value={formData.specialInstruction} onChange={handleChange} className="col-span-2 p-1 border text-xs" placeholder="Special Instruction" rows="2" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Preview */}
      <div className="w-full lg:w-[60%] p-4 bg-gray-400 overflow-auto flex justify-center items-start">
        {/* 
          IMPORTANT: previewRef is attached here.
          Width = 297mm (A4 landscape), Height = 210mm
          padding = 3mm on all sides
        */}
        <div
          ref={previewRef}
          id="lr-preview"
          className="bg-white shadow-2xl"
          style={{
            width: '297mm',
            minHeight: '210mm',
            height: '210mm',
            padding: '3mm',
            fontFamily: 'Arial, Helvetica, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="border-[1.5px] border-black h-full flex flex-col text-black bg-white overflow-hidden"
            style={{ height: '100%' }}
          >
            {/* ── HEADER ──────────────────────────────────────────── */}
            <div className="flex border-b-[1.5px] border-black" style={{ height: '22mm', flexShrink: 0 }}>
              <div className="p-1 flex items-center justify-center" style={{ width: '25%' }}>
                <img src="/mk-logo.png" alt="MK Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ width: '75%' }} className="flex flex-col items-center justify-center text-center px-4">
                <div style={{ fontSize: '19px', fontWeight: '900', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <span style={{ color: '#dc2626' }}>MK</span> LOGISTICS
                </div>
                <div style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: 'bold', marginTop: '2px', lineHeight: 1.3 }}>{formData.officeAddress}</div>
                <div style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold', marginTop: '1px' }}>Mob.{formData.mob} | GST No.{formData.gstNo}</div>
              </div>
            </div>

            {/* ── NOTE ROW ────────────────────────────────────────── */}
            <div className="flex border-b-[1.5px] border-black" style={{ height: '5mm', flexShrink: 0 }}>
              <div style={{ width: '68%', fontSize: '10px', fontWeight: 'bold', padding: '0 2px', display: 'flex', alignItems: 'center' }}>
                NOTE: This Consignment is booked Owner s Risk
              </div>
              <div style={{ width: '32%', borderLeft: '1px solid black', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Tick ( ) Whichever is applicable
              </div>
            </div>

            {/* ── CONSIGNOR ROW ────────────────────────────────────── */}
            <div className="flex border-b border-black" style={{ height: '19mm', flexShrink: 0 }}>
              <div style={{ width: '58%', borderRight: '1px solid black', padding: '2px', fontSize: '11px', fontWeight: 'bold', overflow: 'hidden' }}>
                Consignor Name &amp; Address -
                <span style={{ color: '#1e3a8a', textTransform: 'uppercase', marginLeft: '2px' }}>
                  {formData.consignorName} {formData.consignorAddress}
                </span>
              </div>
              <div style={{ width: '10%', borderRight: '1px solid black', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '5.5mm', borderBottom: '1px solid black', padding: '1px 2px', fontSize: '10px', fontWeight: 'bold' }}>Consignor Code</div>
                <div style={{ flex: 1, padding: '0 3px', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', display: 'flex', alignItems: 'center' }}>{formData.consignorCode}</div>
              </div>
              <div style={{ width: '32%', display: 'flex', flexDirection: 'column' }}>
                {/* TO PAY / PAID / TBB / BOD */}
                <div style={{ height: '4.5mm', padding: '0 3px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', alignItems: 'center', gap: '1px' }}>
                  {['TO PAY', 'PAID', 'TBB', 'BOD'].map(v => (
                    <Checkbox key={v} label={v} checked={formData.bookingType === v} name="bookingType" value={v} />
                  ))}
                </div>
                {/* GODOWN TO GODOWN / FOC */}
                <div style={{ height: '4.5mm', borderBottom: '1px solid black', padding: '0 3px', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '2px' }}>
                  {['GODOWN TO GODOWN', 'FOC'].map(v => (
                    <Checkbox key={v} label={v} checked={formData.deliveryType === v} name="deliveryType" value={v} />
                  ))}
                </div>
                {/* ROAD / TRAIN / AIR / EXPRESS */}
                <div style={{ height: '4.5mm', borderBottom: '1px solid black', padding: '0 3px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', alignItems: 'center', gap: '1px' }}>
                  {['ROAD', 'TRAIN', 'AIR', 'EXPRESS'].map(v => (
                    <Checkbox key={v} label={v} checked={formData.serviceType === v} name="serviceType" value={v} />
                  ))}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}>
                  Applicable Only in MK Logistics Packaging
                </div>
              </div>
            </div>

            {/* ── CONSIGNOR PIN/MOB/GSTIN ──────────────────────────── */}
            <div className="flex border-b border-black" style={{ height: '4mm', flexShrink: 0 }}>
              <div style={{ width: '68%', borderRight: '1px solid black', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '10px', fontWeight: 'bold' }}>
                <div style={{ borderRight: '1px solid black', padding: '0 2px', color: '#dc2626', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  Pin NO <span style={{ color: '#1e3a8a', marginLeft: '3px' }}>{formData.consignorPin}</span>
                </div>
                <div style={{ borderRight: '1px solid black', padding: '0 2px', color: '#dc2626', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  MOB NO <span style={{ color: '#1e3a8a', marginLeft: '3px' }}>{formData.consignorMob}</span>
                </div>
                <div style={{ padding: '0 2px', color: '#dc2626', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  GSTIN No. <span style={{ color: '#1e3a8a', marginLeft: '3px' }}>{formData.consignorGst}</span>
                </div>
              </div>
              <div style={{ width: '32%' }}></div>
            </div>

            {/* ── CONSIGNEE ROW ─────────────────────────────────────── */}
            <div className="flex border-b border-black" style={{ height: '12mm', flexShrink: 0 }}>
              <div style={{ width: '58%', borderRight: '1px solid black', padding: '2px', fontSize: '11px', fontWeight: 'bold', overflow: 'hidden' }}>
                Consgnee Name &amp; Address -
                <span style={{ color: '#1e3a8a', textTransform: 'uppercase', marginLeft: '2px' }}>
                  {formData.consigneeName} {formData.consigneeAddress}
                </span>
              </div>
              <div style={{ width: '10%', borderRight: '1px solid black', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '5.5mm', borderBottom: '1px solid black', padding: '1px 2px', fontSize: '10px', fontWeight: 'bold' }}>Consignee Code</div>
                <div style={{ flex: 1, padding: '0 3px', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', display: 'flex', alignItems: 'center' }}>{formData.consigneeCode}</div>
              </div>
              <div style={{ width: '32%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '4mm', borderBottom: '1px solid black', padding: '0 3px', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
                  {['ISSUE', 'TRANSFER'].map(v => (
                    <Checkbox key={v} label={v} checked={formData.issueType === v} name="issueType" value={v} />
                  ))}
                </div>
                <div style={{ height: '4mm', borderBottom: '1px solid black', padding: '0 3px', fontSize: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  In case of collection &amp; Return, Please mention Customer Name
                </div>
                <div style={{ height: '4mm', padding: '0 3px', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
                  {['COLLECTION', 'RETURN'].map(v => (
                    <Checkbox key={v} label={v} checked={formData.issueType === v} name="issueType" value={v} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── CONSIGNEE PIN/MOB/GSTIN ──────────────────────────── */}
            <div className="flex border-b-[1.5px] border-black" style={{ height: '4mm', flexShrink: 0 }}>
              <div style={{ width: '68%', borderRight: '1px solid black', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '10px', fontWeight: 'bold' }}>
                <div style={{ borderRight: '1px solid black', padding: '0 2px', color: '#dc2626', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  Pin NO <span style={{ color: '#1e3a8a', marginLeft: '3px' }}>{formData.consigneePin}</span>
                </div>
                <div style={{ borderRight: '1px solid black', padding: '0 2px', color: '#dc2626', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  MOB NO <span style={{ color: '#1e3a8a', marginLeft: '3px' }}>{formData.consigneeMob}</span>
                </div>
                <div style={{ padding: '0 2px', color: '#dc2626', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  GSTIN No. <span style={{ color: '#1e3a8a', marginLeft: '3px' }}>{formData.consigneeGst}</span>
                </div>
              </div>
              <div style={{ width: '32%' }}></div>
            </div>

            {/* ── MAIN BODY (flex: 1) ──────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '68% 32%', flex: 1, borderBottom: '1.5px solid black', minHeight: 0 }}>

              {/* LEFT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Customer Name */}
                <div style={{ height: '5mm', padding: '0 3px', display: 'flex', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                  Customer Name:- <span style={{ color: '#1e3a8a', marginLeft: '4px' }}>{formData.customerName}</span>
                </div>

                {/* Empty space for logo area on original */}
                <div style={{ height: '6mm', borderBottom: '1px solid black', flexShrink: 0 }}></div>

                {/* Items Table */}
                <div style={{ flexShrink: 0 }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '14% 36% 16% 16% 18%', height: '6mm', borderTop: '1px solid black', fontSize: '9px', fontWeight: 'bold' }}>
                    {['Type of Packing', 'Description (said to contain)', 'Actual Weight', 'Charged Weight', 'Rate'].map((h, i) => (
                      <div key={i} style={{ borderRight: i < 4 ? '1px solid black' : 'none', padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{h}</div>
                    ))}
                  </div>
                  {/* Data Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '14% 36% 16% 16% 18%', height: '6mm', borderTop: '1px solid black', fontSize: '10px', color: '#1e3a8a' }}>
                    {[formData.items[0]?.typeOfPacking, formData.items[0]?.description, formData.items[0]?.actualWeight, formData.items[0]?.chargedWeight, formData.items[0]?.rate].map((v, i) => (
                      <div key={i} style={{ borderRight: i < 4 ? '1px solid black' : 'none', padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{v || ''}</div>
                    ))}
                  </div>
                  {/* IN INCHES ONLY */}
                  <div style={{ height: '4mm', borderTop: '1px solid black', textAlign: 'center', fontSize: '9px', color: '#dc2626', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    (IN INCHES ONLY)
                  </div>
                  {/* Dimensions Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '19% 15% 15% 15% 36%', height: '5mm', borderTop: '1px solid black', fontSize: '9px', fontWeight: 'bold' }}>
                    {['No. of Packages', 'Lenth', 'Width', 'Height', 'Private marks'].map((h, i) => (
                      <div key={i} style={{ borderRight: i < 4 ? '1px solid black' : 'none', padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{h}</div>
                    ))}
                  </div>
                  {/* Dimensions Data */}
                  <div style={{ display: 'grid', gridTemplateColumns: '19% 15% 15% 15% 36%', height: '10mm', borderTop: '1px solid black', fontSize: '10px' }}>
                    {[formData.noOfPackages, formData.length, formData.width, formData.height].map((v, i) => (
                      <div key={i} style={{ borderRight: '1px solid black', padding: '0 2px', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{v || ''}</div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', fontSize: '9px', fontWeight: 'bold' }}>
                      <div style={{ borderBottom: '1px solid black', padding: '0 2px', display: 'flex', alignItems: 'center' }}>Declared Values</div>
                      <div style={{ padding: '0 2px', display: 'flex', alignItems: 'center' }}>
                        Rs. <span style={{ color: '#1e3a8a', marginLeft: '4px' }}>{formData.declaredValue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dimensions note */}
                <div style={{ height: '4mm', borderTop: '1px solid black', padding: '0 3px', fontStyle: 'italic', fontSize: '7.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  (Dimensions of Consignment in inches only)
                </div>

                {/* Invoice Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '20% 9% 17% 16% 12% 26%', height: '5.5mm', borderTop: '1px solid black', fontSize: '7.5px', fontWeight: 'bold', flexShrink: 0 }}>
                  {['Invoice No.', 'Date', 'Part Name', 'Part No', 'No. Of Pcs', 'E-way Bill No.'].map((h, i) => (
                    <div key={i} style={{ borderRight: i < 5 ? '1px solid black' : 'none', padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{h}</div>
                  ))}
                </div>

                {/* Invoice Rows × 4 */}
                {[0, 1, 2, 3].map(i => {
                  const inv = formData.invoices[i] || {};
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '20% 9% 17% 16% 12% 26%', height: '5mm', borderTop: '1px solid black', fontSize: '9px', color: '#1e3a8a', flexShrink: 0 }}>
                      {[inv.invoiceNo, inv.date, inv.partName, inv.partNo, inv.noOfPcs, inv.ewayBillNo].map((v, j) => (
                        <div key={j} style={{ borderRight: j < 5 ? '1px solid black' : 'none', padding: '0 2px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{v || ''}</div>
                      ))}
                    </div>
                  );
                })}

                {/* RPE Header */}
                <div style={{ height: '5mm', borderTop: '1px solid black', textAlign: 'center', fontSize: '9px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  Returnable Packaging Equipment Details (RPE)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '20% 35% 16% 29%', height: '5mm', borderTop: '1px solid black', fontSize: '7.5px', fontWeight: 'bold', flexShrink: 0 }}>
                  {['RPE TYPE', 'RPE ID / KIT ID', 'QTY.', 'REMARKS'].map((h, i) => (
                    <div key={i} style={{ borderRight: i < 3 ? '1px solid black' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{h}</div>
                  ))}
                </div>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '20% 35% 16% 29%', height: '5mm', borderTop: '1px solid black', fontSize: '9px', color: '#1e3a8a', flexShrink: 0 }}>
                    {[i === 0 ? formData.rpeType : '', i === 0 ? formData.rpeId : '', i === 0 ? formData.rpeQty : '', i === 0 ? formData.rpeRemarks : ''].map((v, j) => (
                      <div key={j} style={{ borderRight: j < 3 ? '1px solid black' : 'none', padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{v}</div>
                    ))}
                  </div>
                ))}

                {/* Footer Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '27% 20% 25% 8% 20%', height: '7mm', borderTop: '1px solid black', fontSize: '7.5px', fontWeight: 'bold', flexShrink: 0 }}>
                  {['Applicable only in case of packaging Services', 'LR No.', 'Special Instruction', 'Shipper Sing.', "Receiver's sing. With Stamp"].map((h, i) => (
                    <div key={i} style={{ borderRight: i < 4 ? '1px solid black' : 'none', padding: '1px 2px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{h}</div>
                  ))}
                </div>

                {/* Footer Data — flex: 1 fills remaining space */}
                <div style={{ display: 'grid', gridTemplateColumns: '27% 20% 25% 8% 20%', flex: 1, borderTop: '1px solid black', fontSize: '8px', color: '#1e3a8a', minHeight: 0 }}>
                  <div style={{ borderRight: '1px solid black' }}></div>
                  <div style={{ borderRight: '1px solid black', padding: '2px 3px' }}>
                    <div>{formData.lrNo}</div>
                    <div style={{ marginTop: '4px', color: 'black', fontWeight: 'bold' }}>GRN No. &amp; Date</div>
                    <div>{formData.grnNo} {formData.grnDate}</div>
                  </div>
                  <div style={{ borderRight: '1px solid black', padding: '2px 3px', textTransform: 'uppercase', overflow: 'hidden' }}>{formData.specialInstruction}</div>
                  <div style={{ borderRight: '1px solid black' }}></div>
                  <div></div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ borderLeft: '1.5px solid black', display: 'flex', flexDirection: 'column' }}>

                {/* FORWARDER NOTE */}
                <div style={{ height: '5mm', borderBottom: '1px solid black', padding: '0 3px', fontSize: '7.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  FORWAEDER CONSIGNMENT NOTE NON NEGOTIABLE
                </div>

                {/* Consignment No */}
                <div style={{ height: '8mm', borderBottom: '1px solid black', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: '55%', padding: '0 3px', fontSize: '10px', fontWeight: 'bold' }}>Consignment</div>
                  <div style={{ width: '45%', fontSize: '16px', fontWeight: '900', color: '#dc2626' }}>{formData.consignmentNo}</div>
                </div>

                {/* FROM / TO */}
                <div style={{ height: '10mm', borderBottom: '1px solid black', display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                  <div style={{ borderRight: '1px solid black', padding: '2px 3px' }}>
                    FROM :- <span style={{ color: '#1e3a8a', fontSize: '11px', fontWeight: '900' }}>{formData.from}</span>
                  </div>
                  <div style={{ padding: '2px 3px' }}>
                    TO :- <span style={{ color: '#1e3a8a', fontSize: '11px', fontWeight: '900' }}>{formData.to}</span>
                  </div>
                </div>

                {/* FREIGHT header */}
                <div style={{ height: '5.5mm', borderBottom: '1px solid black', display: 'grid', gridTemplateColumns: '60% 40%', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                  <div style={{ borderRight: '1px solid black', padding: '0 3px', display: 'flex', alignItems: 'center' }}>FREIGHT</div>
                  <div style={{ padding: '0 3px', display: 'flex', alignItems: 'center', fontStyle: 'italic' }}>AMOUNT Rs.</div>
                </div>

                {/* Charges rows */}
                {[
                  ['FREIGHT', formData.freight],
                  ['ROV', formData.rov],
                  ['FOD / TO PAY', formData.fodToPay],
                  ['FULE/ SURCHARGE', formData.fuelSurcharge],
                  ['COLLECTION', formData.collection],
                  ['DEL.CHARGES', formData.delCharges],
                  ['HAMALI', formData.hamali],
                  ['BUILTY CHARGES', formData.builtyCharges || '200'],
                  ['SUB TOTAL', subTotal || ''],
                  [`G.T.A.SGST ${formData.sgstPercent || ''}%`, sgstAmount || ''],
                  [`G.T.A.CGST ${formData.cgstPercent || ''}%`, cgstAmount || ''],
                  [`G.T.A.IGST/UTGST ${formData.igstPercent || ''}%`, igstAmount || ''],
                  ['GRAND TOTAL', grandTotal || ''],
                ].map(([label, val], i) => (
                  <div
                    key={i}
                    style={{
                      height: '5mm',
                      borderBottom: '1px solid black',
                      display: 'grid',
                      gridTemplateColumns: '60% 40%',
                      fontSize: '10px',
                      fontWeight: label === 'GRAND TOTAL' ? 'bold' : 'normal',
                      backgroundColor: label === 'GRAND TOTAL' ? '#fefce8' : 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ borderRight: '1px solid black', padding: '0 3px', display: 'flex', alignItems: 'center' }}>{label}</div>
                    <div style={{ padding: '0 3px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#1e3a8a' }}>
                      {val !== '' && val !== 0 ? String(val) : ''}
                    </div>
                  </div>
                ))}

                {/* Amount in Words */}
                <div style={{ padding: '3px', fontSize: '7.5px', flexShrink: 0, borderBottom: '1px solid black' }}>
                  In Words :- <span style={{ color: '#1e3a8a', fontStyle: 'italic' }}>{amountInWordsDisplay}</span>
                </div>

                {/* For MK Logistics */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3px' }}>
                  <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                    For <span style={{ color: '#dc2626' }}>MK</span> Logistcs
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', borderTop: '1px solid black', paddingTop: '2px' }}>
                    <span>Prepared By Sing.</span>
                    <span style={{ color: '#1e3a8a', fontStyle: 'italic', fontWeight: 'bold' }}>{formData.preparedBy}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
