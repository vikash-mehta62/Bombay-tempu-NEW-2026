'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, RefreshCw, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { billAPI, lrAPI } from '@/lib/api';
import TruckLoader from '@/components/TruckLoader';

const company = {
  name: 'MK LOGISTICS',
  address: 'G FLORE SHOP NO 13 CITY STAR MALL PRAJIAT CHOWK HISAR HARYANA-125001',
  email: 'MOHITKAREL008@GMAIL.COM',
  gst: '06HNTEM3568J1Z4',
  mobile: '6375916182',
};

const emptyForm = {
  billNo: '',
  billDate: new Date().toISOString().slice(0, 10),
  invoiceTitle: 'TAX INVOICE',
  sacCode: '996791',
  freightAmount: '',
  loadingCharges: '',
  unloadingCharges: '',
  detentionCharges: '',
  otherCharges: '',
  cgstPercent: '',
  sgstPercent: '',
  igstPercent: '18',
  advanceReceived: '',
  lrNo: '',
  lrDate: '',
  unloadingDate: '',
  ewayBillNo: '',
  baCode: '',
  cinNo: '',
  customerGstin: '',
  stateOfSupply: '',
  stateCode: '',
  vehicleType: 'FTL',
  vendor: '',
  invoiceNo: '',
  packageQty: '',
  weight: '',
  rate: '',
  consignor: '',
  consignee: '',
  remarks: '',
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN');
};

const num = (value) => Number(value || 0);

const money = (value) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num(value));
};

const numberToWordsIndian = (value) => {
  const amount = Math.round(num(value));
  if (!amount) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const two = (n) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`.trim());
  const three = (n) => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return `${h ? `${ones[h]} Hundred` : ''}${h && r ? ' ' : ''}${r ? two(r) : ''}`.trim();
  };

  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const rest = amount % 1000;
  return [
    crore ? `${two(crore)} Crore` : '',
    lakh ? `${two(lakh)} Lakh` : '',
    thousand ? `${two(thousand)} Thousand` : '',
    rest ? three(rest) : '',
  ].filter(Boolean).join(' ');
};

const clientName = (client) => client?.companyName || client?.fullName || 'N/A';
const cityName = (city) => [city?.cityName, city?.state].filter(Boolean).join(', ');
const plainCityName = (city) => city?.cityName || '';

const formatBillDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB');
};

const formatLrDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).replace(/ /g, '-');
};

const toDateInput = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const ddmmyyyy = String(value).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (ddmmyyyy) {
    const [, day, month, rawYear] = ddmmyyyy;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const firstFilled = (...values) => values.find((value) => value !== undefined && value !== null && value !== '') || '';

export default function BillsPage() {
  const lrDropdownRef = useRef(null);
  const [lrs, setLrs] = useState([]);
  const [selectedLrId, setSelectedLrId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientDetails, setSelectedClientDetails] = useState(null);
  const [currentBillId, setCurrentBillId] = useState(null);
  const [existingBills, setExistingBills] = useState([]);
  const [search, setSearch] = useState('');
  const [isLrDropdownOpen, setIsLrDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadLRs();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (lrDropdownRef.current && !lrDropdownRef.current.contains(event.target)) {
        setIsLrDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const loadLRs = async () => {
    try {
      setLoading(true);
      const response = await lrAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setLrs(data);
    } catch (error) {
      toast.error('LR load nahi ho paye');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLr = useMemo(() => {
    return lrs.find((lr) => lr._id === selectedLrId) || null;
  }, [lrs, selectedLrId]);

  const lrOptionLabel = (lr) => {
    if (!lr) return '';
    return `${lr.consignmentNo} - ${lr.customerName || lr.consignorName || lr.consigneeName || 'No Customer'} - ${lr.from || 'From'} to ${lr.to || 'To'}`;
  };

  const filteredLrs = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    if (!searchLower) return lrs;

    return lrs.filter((lr) => [
      lr.consignmentNo,
      lr.customerName,
      lr.consignorName,
      lr.consigneeName,
      lr.from,
      lr.to,
      lr.invoices?.[0]?.invoiceNo,
    ].some((value) => String(value || '').toLowerCase().includes(searchLower)));
  }, [lrs, search]);

  const selectedTrip = null;
  const selectedTripClient = useMemo(() => {
    if (!selectedLr) return null;

    return {
      clientId: {
        _id: selectedLr._id,
        fullName: selectedLr.customerName || selectedLr.consignorName || selectedLr.consigneeName || selectedLr.consignmentNo,
        companyName: selectedLr.customerName || '',
        address: selectedLr.consignorAddress || selectedLr.consigneeAddress || '',
        billingAddress: selectedLr.consignorAddress || selectedLr.consigneeAddress || '',
        gstNumber: selectedLr.consignorGst || selectedLr.consigneeGst || '',
      },
      originCity: { cityName: selectedLr.from || '', state: '' },
      destinationCity: { cityName: selectedLr.to || '', state: form.stateOfSupply || '' },
      loadDate: form.lrDate || selectedLr.createdAt,
      unloadingDate: form.unloadingDate,
    };
  }, [selectedLr, form.lrDate, form.unloadingDate, form.stateOfSupply]);

  const totals = useMemo(() => {
    const taxable = num(form.freightAmount) + num(form.loadingCharges) + num(form.unloadingCharges) + num(form.otherCharges);
    const cgst = taxable * num(form.cgstPercent) / 100;
    const sgst = taxable * num(form.sgstPercent) / 100;
    const igst = taxable * num(form.igstPercent) / 100;
    const grand = taxable + cgst + sgst + igst;
    const balance = grand - num(form.advanceReceived);
    return { taxable, cgst, sgst, igst, grand, balance };
  }, [form]);

  const handleLrChange = (lrId) => {
    const lr = lrs.find((item) => item._id === lrId);
    setSelectedLrId(lrId);
    setSearch(lr ? lrOptionLabel(lr) : '');
    setIsLrDropdownOpen(false);
    setSelectedClientId(lr?._id || '');
    setSelectedClientDetails(null);
    setCurrentBillId(null);
    setExistingBills([]);
    fillFromLR(lr);
  };

  const handleClientChange = (clientId) => {
    setSelectedClientId(clientId);
    setSelectedClientDetails(null);
    setCurrentBillId(null);
  };

  const fillFromLR = (lr) => {
    if (!lr) return;

    const firstInvoice = lr.invoices?.find((invoice) => invoice?.invoiceNo || invoice?.date || invoice?.ewayBillNo) || {};
    const firstItem = lr.items?.[0] || {};
    const lrDate = toDateInput(firstInvoice.date || lr.createdAt);
    const customer = {
      _id: lr._id,
      fullName: lr.customerName || lr.consignorName || lr.consigneeName || lr.consignmentNo,
      companyName: lr.customerName || '',
      address: lr.consignorAddress || lr.consigneeAddress || '',
      billingAddress: lr.consignorAddress || lr.consigneeAddress || '',
      gstNumber: lr.consignorGst || lr.consigneeGst || '',
    };

    setForm((prev) => ({
      ...emptyForm,
      billDate: prev.billDate || emptyForm.billDate,
      billNo: `MKL/${new Date().getFullYear()}/${lr.consignmentNo || ''}`.replace(/\/$/, ''),
      lrNo: lr.consignmentNo || lr.lrNo || '',
      lrDate,
      freightAmount: lr.freight || '',
      rate: firstFilled(firstItem.rate, lr.freight),
      loadingCharges: lr.hamali || '',
      unloadingCharges: lr.delCharges || '',
      otherCharges: lr.builtyCharges || '',
      cgstPercent: lr.cgstPercent || '',
      sgstPercent: lr.sgstPercent || '',
      igstPercent: lr.igstPercent || '',
      customerGstin: customer.gstNumber,
      invoiceNo: firstInvoice.invoiceNo || '',
      ewayBillNo: firstInvoice.ewayBillNo || '',
      packageQty: firstFilled(lr.noOfPackages, firstInvoice.noOfPcs),
      weight: firstFilled(firstItem.chargedWeight, firstItem.actualWeight),
      consignor: lr.consignorName || '',
      consignee: lr.consigneeName || '',
      remarks: lr.specialInstruction || '',
    }));

    setSelectedClientDetails(customer);
  };

  useEffect(() => {
    if (selectedLr && !selectedClientDetails) {
      fillFromLR(selectedLr);
    }
  }, [selectedLr]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const applySavedBill = (bill) => {
    setCurrentBillId(bill?._id || null);
    if (!bill) return;

    setForm((prev) => ({
      ...prev,
      billNo: bill.billNo || '',
      billDate: bill.billDate ? new Date(bill.billDate).toISOString().slice(0, 10) : prev.billDate,
      invoiceTitle: bill.invoiceTitle || 'TAX INVOICE',
      sacCode: bill.sacCode || '996791',
      freightAmount: bill.freightAmount ?? '',
      loadingCharges: bill.loadingCharges ?? '',
      unloadingCharges: bill.unloadingCharges ?? '',
      detentionCharges: bill.detentionCharges ?? '',
      otherCharges: bill.otherCharges ?? '',
      cgstPercent: bill.cgstPercent ?? '',
      sgstPercent: bill.sgstPercent ?? '',
      igstPercent: bill.igstPercent ?? '',
      advanceReceived: bill.advanceReceived ?? '',
      lrNo: bill.lrNo || '',
      lrDate: bill.lrDate ? new Date(bill.lrDate).toISOString().slice(0, 10) : '',
      unloadingDate: bill.unloadingDate ? new Date(bill.unloadingDate).toISOString().slice(0, 10) : '',
      ewayBillNo: bill.ewayBillNo || '',
      baCode: bill.baCode || '',
      cinNo: bill.cinNo || '',
      customerGstin: bill.customerGstin || bill.clientId?.gstNumber || '',
      stateOfSupply: bill.stateOfSupply || '',
      stateCode: bill.stateCode || '',
      vehicleType: bill.vehicleType || '',
      vendor: bill.vendor || '',
      invoiceNo: bill.invoiceNo || bill.tripId?.tripNumber || '',
      packageQty: bill.packageQty ?? '',
      weight: bill.weight ?? '',
      rate: bill.rate ?? '',
      consignor: bill.consignor || '',
      consignee: bill.consignee || '',
      remarks: bill.remarks || '',
    }));
  };

  const loadBillsByTrip = async (tripId) => {
    try {
      const response = await billAPI.getByTrip(tripId);
      setExistingBills(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSavedBill = async (tripId, clientId) => {
    try {
      const response = await billAPI.getByTripAndClient(tripId, clientId);
      const bill = response.data.data;
      if (bill) {
        applySavedBill(bill);
        toast.success('Saved bill loaded');
      } else {
        setCurrentBillId(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const buildPayload = () => ({
    tripId: selectedTrip?._id,
    clientId: selectedClientId,
    ...form,
    taxableAmount: totals.taxable,
    cgstAmount: totals.cgst,
    sgstAmount: totals.sgst,
    igstAmount: totals.igst,
    grandTotal: totals.grand,
    balancePayable: totals.balance,
  });

  const saveBill = async ({ silent = false } = {}) => {
    if (!selectedLr) {
      toast.error('Pehle LR select karo');
      return null;
    }

    if (!form.billNo || !form.billDate) {
      toast.error('Bill No aur Bill Date required hai');
      return null;
    }

    if (!selectedTrip) {
      const localBill = {
        _id: currentBillId,
        ...form,
        clientId: selectedClientDetails || selectedTripClient?.clientId,
        taxableAmount: totals.taxable,
        cgstAmount: totals.cgst,
        sgstAmount: totals.sgst,
        igstAmount: totals.igst,
        grandTotal: totals.grand,
        balancePayable: totals.balance,
      };
      if (!silent) toast.success('Bill details ready');
      return localBill;
    }

    try {
      setSaving(true);
      const response = await billAPI.save(buildPayload());
      const savedBill = response.data.data;
      applySavedBill(savedBill);
      if (selectedTrip?._id) loadBillsByTrip(selectedTrip._id);
      if (!silent) toast.success('Bill database me save ho gaya');
      return savedBill;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bill save nahi ho paya');
      console.error(error);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const buildInvoiceRow = (client = selectedClientDetails || selectedTripClient?.clientId) => {
    const firstInvoice = selectedLr?.invoices?.[0] || {};

    return {
      lrNo: form.lrNo || selectedLr?.consignmentNo || '',
      lrDate: formatLrDate(form.lrDate || selectedTripClient?.loadDate || selectedLr?.createdAt),
      vehicleNo: form.vehicleNo || '',
      vehicleType: form.vehicleType || 'FTL',
      from: selectedLr?.from || plainCityName(selectedTripClient?.originCity),
      to: selectedLr?.to || plainCityName(selectedTripClient?.destinationCity),
      unloadingDate: formatLrDate(form.unloadingDate),
      vendor: form.vendor || '',
      invoiceNo: form.invoiceNo || firstInvoice.invoiceNo || '',
      packageQty: num(form.packageQty),
      weight: num(form.weight),
      rate: num(form.rate || form.freightAmount),
      freight: num(form.freightAmount),
      loading: num(form.loadingCharges),
      twoPoint: num(form.unloadingCharges),
      lrCharges: num(form.otherCharges),
      total: totals.taxable,
      client,
    };
  };

  const generateBill = async () => {
    if (!selectedLr) {
      toast.error('Pehle LR select karo');
      return;
    }

    try {
      setGenerating(true);
      const savedBill = await saveBill({ silent: true });
      if (!savedBill) return;

      const client = selectedClientDetails || selectedTripClient?.clientId;
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 5;
      const top = 8;
      const width = pageWidth - 10;
      const right = left + width;
      const bottom = 206;
      const row = buildInvoiceRow(client);
      const customerGstin = form.customerGstin || client?.gstNumber || '';

      const text = (value, x, y, options = {}) => {
        doc.setFont('helvetica', options.bold ? 'bold' : options.italic ? 'italic' : 'normal');
        doc.setFontSize(options.size || 8);
        doc.text(String(value || ''), x, y, {
          align: options.align || 'left',
          maxWidth: options.maxWidth,
        });
      };

      doc.setDrawColor(0);
      doc.setLineWidth(0.45);
      doc.rect(left, top, width, bottom - top);

      text(company.name, pageWidth / 2, 13, { bold: true, size: 9, align: 'center' });
      text('Address Head Off :-', 72, 19, { bold: true, size: 8 });
      text(company.address, 103, 19, { italic: true, size: 8 });
      doc.setTextColor(0, 0, 180);
      text(`EMAIL :- ${company.email}`, pageWidth / 2, 25, { bold: true, size: 8, align: 'center' });
      doc.setTextColor(0);
      text(`PH. ${company.mobile}`, pageWidth / 2, 31, { bold: true, size: 8, align: 'center' });

      text('To,', left + 1, 38, { bold: true, size: 9 });
      text(clientName(client), left + 11, 38, { bold: true, size: 9 });
      text(`${clientName(client)} ${client?.billingAddress || client?.address || ''}`, left + 1, 44, { italic: true, size: 8, maxWidth: 150 });
      text(`State Name : ${form.stateOfSupply || selectedTripClient?.destinationCity?.state || ''}`, left + 1, 58, { bold: true, italic: true, size: 8 });
      text(`GSTIN : ${customerGstin}`, left + 1, 64, { bold: true, italic: true, size: 8 });

      const detailX = 226;
      const detailValueX = 260;
      [
        ['Bill No', form.billNo],
        ['Bill Date', formatBillDate(form.billDate)],
        ['BA Code', form.baCode],
        ['GSTIN', company.gst],
        ['CIN No.', form.cinNo],
        ['SAC NO', form.sacCode],
      ].forEach(([label, value], index) => {
        const y = 38 + index * 6;
        text(label, detailX, y, { bold: true, size: 8 });
        text(value, detailValueX, y, { italic: true, size: 8, align: 'left' });
      });
      text('State of Supply', detailX, 74, { bold: true, size: 8 });
      doc.setFillColor(255, 255, 0);
      doc.rect(256, 70, 36, 6, 'F');
      text(form.stateOfSupply || selectedTripClient?.destinationCity?.state || '', 274, 74, { italic: true, size: 8, align: 'center' });
      text('State Code', detailX, 80, { bold: true, size: 8 });
      text(form.stateCode || '', 274, 80, { italic: true, size: 8, align: 'center' });

      const tableTop = 84;
      const headerH = 16;
      const dataH = 16;
      const totalH = 16;
      const cols = [9, 13, 16, 15, 14, 20, 17, 13, 19, 15, 16, 16, 16, 18, 15, 18, 17, 20];
      const headers = ['S.No', 'LR\nNo.', 'LR Date', 'Vehicle\nNo.', 'Veh\nType', 'From', 'To', 'Unloading\nDate', 'Vendor', 'Invoice No', 'Pkg/Qty', 'Weight\n/KGS/\nMT', 'Rate', 'Freight', 'Loading\nCH.', 'Two\nPoint\nDelivery', 'LR\nCharges', 'Total\nAmount'];
      const values = [1, row.lrNo, row.lrDate, row.vehicleNo, row.vehicleType, row.from, row.to, row.unloadingDate, row.vendor, row.invoiceNo, row.packageQty, row.weight, money(row.rate), money(row.freight), money(row.loading), money(row.twoPoint), money(row.lrCharges), money(row.total)];
      const totalsValues = ['', '', '', '', '', '', '', '', 'Total:-', '', row.packageQty, row.weight, money(row.rate), money(row.freight), money(row.loading), money(row.twoPoint), money(row.lrCharges), money(row.total)];

      doc.setLineWidth(0.35);
      doc.line(left, tableTop, right, tableTop);
      doc.setFillColor(226, 184, 184);
      doc.rect(left, tableTop, width, headerH, 'F');
      let x = left;
      headers.forEach((header, i) => {
        text(header, x + cols[i] / 2, tableTop + 6, { bold: true, size: 7.2, align: 'center', maxWidth: cols[i] - 1 });
        x += cols[i];
      });
      doc.line(left, tableTop + headerH, right, tableTop + headerH);

      x = left;
      values.forEach((value, i) => {
        text(value, x + cols[i] / 2, tableTop + headerH + 9, { italic: true, size: 7.1, align: 'center', maxWidth: cols[i] - 1 });
        x += cols[i];
      });
      doc.line(left, tableTop + headerH + dataH, right, tableTop + headerH + dataH);

      x = left;
      totalsValues.forEach((value, i) => {
        text(value, x + cols[i] / 2, tableTop + headerH + dataH + 10, { bold: i === 8, italic: i !== 8, size: 7.1, align: 'center', maxWidth: cols[i] - 1 });
        x += cols[i];
      });

      const totalY = tableTop + headerH + dataH + totalH;
      const taxY = totalY + 11;
      const grandY = taxY + 12;
      const taxLabel = totals.igst ? `IGST (Integrated Tex)@${form.igstPercent || 0}%` : totals.cgst || totals.sgst ? `GST@${num(form.cgstPercent) + num(form.sgstPercent)}%` : '';
      text(taxLabel, 210, taxY, { bold: true, size: 8 });
      text(money(totals.igst || totals.cgst + totals.sgst), 288, taxY, { italic: true, size: 8, align: 'right' });
      text('GRAND TOTAL:-', 217, grandY, { bold: true, size: 9 });
      text(money(totals.grand), 288, grandY, { bold: true, size: 9, align: 'right' });

      text('Total invoice value [ in Words] :', left + 5, grandY + 8, { bold: true, size: 8 });
      text(`${numberToWordsIndian(totals.grand)} Only`, left + 60, grandY + 8, { italic: true, size: 8, maxWidth: 150 });
      doc.line(left, grandY + 10, right, grandY + 10);

      const defaultRemarks = 'Customer is not liable to pay GST under Reverse Charge since M/s. M k logistics. being GTA supplier has opted to pay GST under Forward Charge.';
      const remarksLines = doc.splitTextToSize(`Remarks - ${form.remarks || defaultRemarks}`, 280);
      const remarksY = grandY + 19;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(remarksLines, left + 1, remarksY);

      const classificationY = remarksY + remarksLines.length * 3.5 + 8;
      const billRemarksY = classificationY + 8;
      const termsY = Math.max(billRemarksY + 10, bottom - 12);
      text('Classification of supply - Exempted', left + 1, classificationY, { bold: true, size: 8 });
      text('Bill Remarks', left + 10, billRemarksY, { bold: true, size: 8 });
      text('TERMS & CONDITIONS  :', left + 1, termsY, { bold: true, size: 8 });
      text('NOTE: Please pay A/c. Payee Cheque Only.', left + 1, termsY + 6, { size: 7 });
      text(`FOR:-  ${company.name}`, 208, termsY, { bold: true, size: 8 });
      doc.line(208, termsY + 1, 245, termsY + 1);

      const clean = (value) => String(value || '').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 35);
      doc.save(`Bill_${clean(form.billNo || selectedLr?.consignmentNo)}_${clean(clientName(client))}.pdf`);
      toast.success('Bill save aur PDF download ho gaya');
    } catch (error) {
      console.error(error);
      toast.error('Bill PDF generate nahi ho paya');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <TruckLoader size="lg" message="Loading bills..." />
      </div>
    );
  }

  const previewClient = selectedClientDetails || selectedTripClient?.clientId;
  const previewRow = buildInvoiceRow(previewClient);
  const previewCustomerGstin = form.customerGstin || previewClient?.gstNumber || '';
  const taxLabel = totals.igst ? `IGST (Integrated Tex)@${form.igstPercent || 0}%` : totals.cgst || totals.sgst ? `GST@${num(form.cgstPercent) + num(form.sgstPercent)}%` : '';
  const taxAmount = totals.igst || totals.cgst + totals.sgst;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
          <p className="text-sm text-gray-600">LR select karke us LR ki details se MK Logistics bill download karo.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => saveBill()} disabled={saving || generating} className="btn btn-secondary flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Bill
          </button>
          <button onClick={generateBill} disabled={generating || saving} className="btn btn-primary flex items-center justify-center gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Save & Download
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="card space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">LR</label>
            <div ref={lrDropdownRef} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedLrId('');
                  setIsLrDropdownOpen(true);
                }}
                onFocus={() => setIsLrDropdownOpen(true)}
                placeholder="LR/customer/from/to search"
                className="input w-full pl-9 pr-11"
              />
              <button onClick={loadLRs} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200" title="Refresh LRs" type="button">
                <RefreshCw className="h-4 w-4" />
              </button>
              {isLrDropdownOpen && (
                <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {filteredLrs.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No LR found</div>
                  ) : (
                    filteredLrs.map((lr) => (
                      <button
                        key={lr._id}
                        type="button"
                        onClick={() => handleLrChange(lr._id)}
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${selectedLrId === lr._id ? 'bg-blue-100 text-blue-800' : 'text-gray-800'}`}
                      >
                        {lrOptionLabel(lr)}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {currentBillId && (
            <p className="text-xs font-medium text-green-700">Saved bill loaded. Changes save karne par isi bill me update honge.</p>
          )}

          {existingBills.length > 0 && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 text-sm font-semibold text-gray-700">Saved bills in this trip</div>
              <div className="space-y-1">
                {existingBills.map((bill) => (
                  <button
                    key={bill._id}
                    type="button"
                    onClick={() => handleClientChange(bill.clientId?._id)}
                    className={`block w-full rounded px-2 py-1 text-left text-xs ${
                      bill.clientId?._id === selectedClientId ? 'bg-blue-100 text-blue-800' : 'hover:bg-white'
                    }`}
                  >
                    {bill.billNo} - {clientName(bill.clientId)} - Rs {money(bill.balancePayable)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bill No" value={form.billNo} onChange={(v) => updateField('billNo', v)} />
            <Field label="Bill Date" type="date" value={form.billDate} onChange={(v) => updateField('billDate', v)} />
            <Field label="LR No" value={form.lrNo} onChange={(v) => updateField('lrNo', v)} />
            <Field label="LR Date" type="date" value={form.lrDate} onChange={(v) => updateField('lrDate', v)} />
            <Field label="Unloading Date" type="date" value={form.unloadingDate} onChange={(v) => updateField('unloadingDate', v)} />
            <Field label="Vendor" value={form.vendor} onChange={(v) => updateField('vendor', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Freight" type="number" value={form.freightAmount} onChange={(v) => updateField('freightAmount', v)} />
            <Field label="Rate" type="number" value={form.rate} onChange={(v) => updateField('rate', v)} />
            <Field label="Loading CH." type="number" value={form.loadingCharges} onChange={(v) => updateField('loadingCharges', v)} />
            <Field label="Two Point Delivery" type="number" value={form.unloadingCharges} onChange={(v) => updateField('unloadingCharges', v)} />
            <Field label="LR Charges" type="number" value={form.otherCharges} onChange={(v) => updateField('otherCharges', v)} />
            <Field label="Pkg/Qty" type="number" value={form.packageQty} onChange={(v) => updateField('packageQty', v)} />
            <Field label="Weight /KGS/MT" type="number" value={form.weight} onChange={(v) => updateField('weight', v)} />
            <Field label="Invoice No" value={form.invoiceNo} onChange={(v) => updateField('invoiceNo', v)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="CGST %" type="number" value={form.cgstPercent} onChange={(v) => updateField('cgstPercent', v)} />
            <Field label="SGST %" type="number" value={form.sgstPercent} onChange={(v) => updateField('sgstPercent', v)} />
            <Field label="IGST %" type="number" value={form.igstPercent} onChange={(v) => updateField('igstPercent', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="BA Code" value={form.baCode} onChange={(v) => updateField('baCode', v)} />
            <Field label="CIN No." value={form.cinNo} onChange={(v) => updateField('cinNo', v)} />
            <Field label="Customer GSTIN" value={form.customerGstin} onChange={(v) => updateField('customerGstin', v)} />
            <Field label="SAC No." value={form.sacCode} onChange={(v) => updateField('sacCode', v)} />
            <Field label="State Code" value={form.stateCode} onChange={(v) => updateField('stateCode', v)} />
            <Field label="State of Supply" value={form.stateOfSupply} onChange={(v) => updateField('stateOfSupply', v)} />
            <Field label="Vehicle Type" value={form.vehicleType} onChange={(v) => updateField('vehicleType', v)} />
            <Field label="E-Way Bill No" value={form.ewayBillNo} onChange={(v) => updateField('ewayBillNo', v)} />
          </div>

          <Field label="Consignor" value={form.consignor} onChange={(v) => updateField('consignor', v)} />
          <Field label="Consignee" value={form.consignee} onChange={(v) => updateField('consignee', v)} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Remarks</span>
            <textarea value={form.remarks} onChange={(e) => updateField('remarks', e.target.value)} className="input min-h-[82px] w-full" />
          </label>
        </div>

        <div className="card overflow-hidden">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FileSpreadsheet className="h-4 w-4" />
            Bill Preview
          </div>
          <div className="overflow-x-auto">
            <div className="mx-auto w-[1120px] border-[3px] border-black bg-white text-[13px] text-black shadow-sm">
              <div className="px-1 py-1 text-center font-bold">{company.name}</div>
              <div className="text-center text-[13px]">
                <span className="font-bold">Address Head Off :- </span>
                <span className="italic">{company.address}</span>
              </div>
              <div className="text-center text-[13px] font-bold text-blue-700 underline">EMAIL :- {company.email}</div>
              <div className="text-center text-[13px] font-bold">PH. {company.mobile}</div>

              <div className="grid grid-cols-[1fr_300px] gap-6 px-1 pb-1 pt-2">
                <div>
                  <div className="font-bold">To, <span className="ml-4">{clientName(previewClient)}</span></div>
                  <div className="max-w-[560px] italic">{clientName(previewClient)} {previewClient?.billingAddress || previewClient?.address || ''}</div>
                  <div className="mt-1 font-bold italic">State Name : {form.stateOfSupply || selectedTripClient?.destinationCity?.state || ''}</div>
                  <div className="font-bold italic">GSTIN : {previewCustomerGstin}</div>
                </div>
                <div className="text-[13px]">
                  {[
                    ['Bill No', form.billNo],
                    ['Bill Date', formatBillDate(form.billDate)],
                    ['BA Code', form.baCode],
                    ['GSTIN', company.gst],
                    ['CIN No.', form.cinNo],
                    ['SAC NO', form.sacCode],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[110px_1fr]">
                      <span className="font-bold">{label}</span>
                      <span className="text-right italic">{value}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[110px_1fr]">
                    <span className="font-bold">State of Supply</span>
                    <span className="bg-yellow-300 text-center italic">{form.stateOfSupply || selectedTripClient?.destinationCity?.state || ''}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr]">
                    <span className="font-bold">State Code</span>
                    <span className="text-center italic">{form.stateCode}</span>
                  </div>
                </div>
              </div>

              <table className="w-full border-y-2 border-black text-center text-[12px]">
                <thead className="bg-[#e2b8b8]">
                  <tr>
                    {['S.No', 'LR No.', 'LR Date', 'Vehicle No.', 'Veh Type', 'From', 'To', 'Unloading Date', 'Vendor', 'Invoice No', 'Pkg/Qty', 'Weight /KGS/ MT', 'Rate', 'Freight', 'Loading CH.', 'Two Point Delivery', 'LR Charges', 'Total Amount'].map((h) => (
                      <th key={h} className="px-1 py-2 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="italic">
                  <tr className="h-14">
                    {[1, previewRow.lrNo, previewRow.lrDate, previewRow.vehicleNo, previewRow.vehicleType, previewRow.from, previewRow.to, previewRow.unloadingDate, previewRow.vendor, previewRow.invoiceNo, previewRow.packageQty, previewRow.weight, money(previewRow.rate), money(previewRow.freight), money(previewRow.loading), money(previewRow.twoPoint), money(previewRow.lrCharges), money(previewRow.total)].map((v, i) => (
                      <td key={i} className="px-1">{v}</td>
                    ))}
                  </tr>
                  <tr className="h-12 border-t-2 border-black">
                    {['', '', '', '', '', '', '', '', 'Total:-', '', previewRow.packageQty, previewRow.weight, money(previewRow.rate), money(previewRow.freight), money(previewRow.loading), money(previewRow.twoPoint), money(previewRow.lrCharges), money(previewRow.total)].map((v, i) => (
                      <td key={i} className={`px-1 ${i === 8 ? 'font-bold not-italic' : ''}`}>{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <div className="min-h-[128px] px-4 py-4">
                <div className="ml-auto grid w-[330px] grid-cols-[1fr_110px] gap-y-6">
                  <span className="font-bold">{taxLabel}</span>
                  <span className="text-right italic">{money(taxAmount)}</span>
                  <span className="text-lg font-bold">GRAND TOTAL:-</span>
                  <span className="text-right text-lg font-bold">{money(totals.grand)}</span>
                </div>
                <div className="mt-2 font-bold">Total invoice value [ in Words] : <span className="font-normal italic">{numberToWordsIndian(totals.grand)} Only</span></div>
              </div>

              <div className="border-t border-black px-1 py-4">
                <div><span className="font-bold">Remarks - </span>{form.remarks || 'Customer is not liable to pay GST under Reverse Charge since M/s. M k logistics. being GTA supplier has opted to pay GST under Forward Charge.'}</div>
                <div className="mt-6 font-bold">Classification of supply - Exempted</div>
                <div className="ml-10 mt-4 font-bold">Bill Remarks</div>
                <div className="mt-8 grid grid-cols-[1fr_340px]">
                  <div>
                    <div className="font-bold underline">TERMS & CONDITIONS&nbsp; :</div>
                    <div className="mt-2 text-[11px]">NOTE: Please pay A/c. Payee Cheque Only.</div>
                  </div>
                  <div className="font-bold underline">FOR:-&nbsp; {company.name}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input w-full" />
    </label>
  );
}
