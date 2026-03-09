'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tripAPI, tripExpenseAPI, tripAdvanceAPI, clientPaymentAPI, clientExpenseAPI, collectionMemoAPI, balanceMemoAPI, clientPODAPI } from '@/lib/api';
import { toast } from 'sonner';
import CollectionMemoModal from '@/components/CollectionMemoModal';
import BalanceMemoModal from '@/components/BalanceMemoModal';
import ReceiptPreviewModal from '@/components/ReceiptPreviewModal';
import { generateClientReceipt } from '@/utils/receiptGenerator';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Calendar, 
  User, 
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Edit,
  X,
  Trash2,
  CheckCircle,
  Package,
  FileCheck,
  Send,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Upload,
  Eye,
  Clock
} from 'lucide-react';

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [tripStatus, setTripStatus] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalAdvances, setTotalAdvances] = useState(0);
  const [activeTab, setActiveTab] = useState('expenses'); // Add tab state
  const [selectedClientIndex, setSelectedClientIndex] = useState(0); // Add client tab state
  
  // Client payment/expense states
  const [showClientPaymentModal, setShowClientPaymentModal] = useState(false);
  const [showClientExpenseModal, setShowClientExpenseModal] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState(null);
  const [clientPayments, setClientPayments] = useState({});
  const [clientExpenses, setClientExpenses] = useState({});
  
  // Expense form
  const [expenseForm, setExpenseForm] = useState({
    expenseType: 'fuel',
    amount: '',
    description: '',
    additionalNotes: '',
    receiptNumber: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Advance form
  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    description: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Client payment form
  const [clientPaymentForm, setClientPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
    purpose: 'General',
    paymentDate: new Date().toISOString().split('T')[0]
  });
  
  // Client expense form
  const [clientExpenseForm, setClientExpenseForm] = useState({
    amount: '',
    paidBy: 'self',
    expenseType: 'Other',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });
  
  // Collection and Balance Memos states
  const [showCollectionMemoModal, setShowCollectionMemoModal] = useState(false);
  const [showBalanceMemoModal, setShowBalanceMemoModal] = useState(false);
  const [selectedClientForMemo, setSelectedClientForMemo] = useState(null);
  const [collectionMemos, setCollectionMemos] = useState([]);
  const [balanceMemos, setBalanceMemos] = useState([]);
  const [editingMemo, setEditingMemo] = useState(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  
  // Client POD states
  const [clientPODs, setClientPODs] = useState({});
  const [showPODModal, setShowPODModal] = useState(false);
  const [selectedClientForPOD, setSelectedClientForPOD] = useState(null);
  const [podForm, setPodForm] = useState({
    status: 'pod_pending',
    document: null,
    notes: ''
  });
  const [currentPODStep, setCurrentPODStep] = useState({}); // Track current step per client
  const [showUploadSection, setShowUploadSection] = useState({}); // Track upload section visibility per client
  const [previewDocument, setPreviewDocument] = useState(null); // For document preview modal
  const [showManagePODModal, setShowManagePODModal] = useState(false); // For manage POD modal
  const [actualPodForm, setActualPodForm] = useState({ 
    actualPodAmt: 0,
    paymentType: 'cash',
    notes: ''
  });
  
  const handleCreateCollectionMemo = async (memoData) => {
    try {
      const clientId = selectedClientForMemo?.clientId?._id;
      
      if (editingMemo) {
        // Update existing memo
        await collectionMemoAPI.update(editingMemo._id, {
          ...memoData,
          tripId: params.id,
          clientId: clientId
        });
        toast.success('Collection memo updated successfully');
      } else {
        // Create new memo
        await collectionMemoAPI.create({
          ...memoData,
          tripId: params.id,
          clientId: clientId
        });
        toast.success('Collection memo created successfully');
      }
      
      setShowCollectionMemoModal(false);
      setEditingMemo(null);
      loadCollectionMemos();
    } catch (error) {
      console.error('Error saving memo:', error);
      toast.error(editingMemo ? 'Failed to update collection memo' : 'Failed to create collection memo');
    }
  };
  
  const handleDeleteCollectionMemo = async (memoId) => {
    if (!confirm('Are you sure you want to delete this memo?')) return;
    try {
      await collectionMemoAPI.delete(memoId);
      toast.success('Memo deleted');
      loadCollectionMemos();
    } catch (error) {
      toast.error('Failed to delete memo');
    }
  };
  
  const handleEditMemo = (memo) => {
    console.log('Edit memo clicked:', memo);
    console.log('Trip clients:', trip.clients);
    
    // memo.clientId can be either a string ID or an object with _id
    const memoClientId = typeof memo.clientId === 'string' ? memo.clientId : memo.clientId?._id;
    console.log('Looking for client ID:', memoClientId);
    
    // trip.clients[].clientId is an object with _id
    const foundClient = trip.clients.find(c => {
      const tripClientId = c.clientId?._id || c.clientId;
      return tripClientId === memoClientId;
    });
    
    console.log('Found client:', foundClient);
    
    if (!foundClient) {
      toast.error('Client not found for this memo');
      return;
    }
    
    setEditingMemo(memo);
    setSelectedClientForMemo(foundClient);
    setShowCollectionMemoModal(true);
  };
  
  const handleCreateBalanceMemo = async (memoData) => {
    try {
      const clientId = selectedClientForMemo?.clientId?._id;
      await balanceMemoAPI.create({
        ...memoData,
        tripId: params.id,
        clientId: clientId
      });
      toast.success('Balance memo created successfully');
      setShowBalanceMemoModal(false);
      loadBalanceMemos();
    } catch (error) {
      console.error('Error creating balance memo:', error);
      toast.error('Failed to create balance memo');
    }
  };
  
  const getClientPaymentsArray = (clientId) => {
    return clientPayments[clientId] || [];
  };

;

  useEffect(() => {
    if (params.id) {
      loadTripDetails();
      loadExpenses();
      loadAdvances();
      loadCollectionMemos();
      loadBalanceMemos();
    }
  }, [params.id]);
  
  useEffect(() => {
    if (trip?.clients) {
      trip.clients.forEach(client => {
        if (client.clientId?._id) {
          loadClientPayments(client.clientId._id);
          loadClientExpenses(client.clientId._id);
          loadClientPOD(client.clientId._id);
        }
      });
    }
  }, [trip]);

  const loadTripDetails = async () => {
    try {
      const response = await tripAPI.getById(params.id);
      setTrip(response.data.data);
      setTripStatus(response.data.data.status);
    } catch (error) {
      toast.error('Failed to load trip details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const response = await tripExpenseAPI.getByTrip(params.id);
      setExpenses(response.data.data);
      setTotalExpenses(response.data.totalExpenses || 0);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const loadAdvances = async () => {
    try {
      const response = await tripAdvanceAPI.getByTrip(params.id);
      setAdvances(response.data.data);
      setTotalAdvances(response.data.totalAdvances || 0);
    } catch (error) {
      console.error('Failed to load advances:', error);
    }
  };
  
  const loadCollectionMemos = async () => {
    try {
      const response = await collectionMemoAPI.getByTrip(params.id);
      setCollectionMemos(response.data.data || []);
    } catch (error) {
      console.error('Failed to load collection memos:', error);
    }
  };
  
  const loadBalanceMemos = async () => {
    try {
      const response = await balanceMemoAPI.getByTrip(params.id);
      setBalanceMemos(response.data.data || []);
    } catch (error) {
      console.error('Failed to load balance memos:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await tripAPI.updateStatus(params.id, newStatus);
      setTripStatus(newStatus);
      toast.success('Trip status updated successfully');
      loadTripDetails();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    // For fleet-owned: fleetOwnerId required
    // For self-owned: vehicleId required
    const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
    const fleetOwnerId = trip.vehicleId?.fleetOwnerId?._id || null;
    const vehicleId = trip.vehicleId?._id || null;
    
    try {
      await tripExpenseAPI.create({
        tripId: params.id,
        fleetOwnerId: isFleetOwned ? fleetOwnerId : null,
        vehicleId: !isFleetOwned ? vehicleId : null,
        ...expenseForm
      });
      toast.success(isFleetOwned ? 'Fleet owner expense added successfully' : 'Vehicle expense added successfully');
      setShowExpenseModal(false);
      setExpenseForm({
        expenseType: 'fuel',
        amount: '',
        description: '',
        additionalNotes: '',
        receiptNumber: '',
        date: new Date().toISOString().split('T')[0]
      });
      loadExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    
    // For fleet-owned: fleetOwnerId required
    // For self-owned: driverId required (optional, can be null)
    const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
    
    if (isFleetOwned && !trip.vehicleId?.fleetOwnerId?._id) {
      toast.error('Fleet owner not found');
      return;
    }
    
    try {
      await tripAdvanceAPI.create({
        tripId: params.id,
        fleetOwnerId: isFleetOwned ? trip.vehicleId.fleetOwnerId._id : null,
        driverId: !isFleetOwned ? trip.driverId?._id : null,
        ...advanceForm
      });
      toast.success(isFleetOwned ? 'Fleet owner advance added successfully' : 'Driver advance added successfully');
      setShowAdvanceModal(false);
      setAdvanceForm({
        amount: '',
        description: '',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0]
      });
      loadAdvances();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add advance');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await tripExpenseAPI.delete(id);
      toast.success('Expense deleted');
      loadExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleDeleteAdvance = async (id) => {
    if (!confirm('Are you sure you want to delete this advance?')) return;
    try {
      await tripAdvanceAPI.delete(id);
      toast.success('Advance deleted');
      loadAdvances();
    } catch (error) {
      toast.error('Failed to delete advance');
    }
  };
  
  const loadClientPayments = async (clientId) => {
    try {
      const response = await clientPaymentAPI.getByTripAndClient(params.id, clientId);
      setClientPayments(prev => ({
        ...prev,
        [clientId]: response.data.data
      }));
    } catch (error) {
      console.error('Failed to load client payments:', error);
    }
  };
  
  const loadClientExpenses = async (clientId) => {
    try {
      const response = await clientExpenseAPI.getByTripAndClient(params.id, clientId);
      setClientExpenses(prev => ({
        ...prev,
        [clientId]: response.data.data
      }));
    } catch (error) {
      console.error('Failed to load client expenses:', error);
    }
  };
  
  const handleOpenClientPaymentModal = (client) => {
    setSelectedClientForPayment(client);
    setShowClientPaymentModal(true);
  };
  
  const handleOpenClientExpenseModal = (client) => {
    setSelectedClientForPayment(client);
    setShowClientExpenseModal(true);
  };
  
  const handleAddClientPayment = async (e) => {
    e.preventDefault();
    if (!selectedClientForPayment?.clientId?._id) return;
    
    try {
      await clientPaymentAPI.create({
        tripId: params.id,
        clientId: selectedClientForPayment.clientId._id,
        ...clientPaymentForm
      });
      toast.success('Client payment added successfully');
      setShowClientPaymentModal(false);
      setClientPaymentForm({
        amount: '',
        paymentMethod: 'cash',
        notes: '',
        purpose: 'General',
        paymentDate: new Date().toISOString().split('T')[0]
      });
      loadClientPayments(selectedClientForPayment.clientId._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add payment');
    }
  };
  
  const handleAddClientExpense = async (e) => {
    e.preventDefault();
    if (!selectedClientForPayment?.clientId?._id) return;
    
    try {
      await clientExpenseAPI.create({
        tripId: params.id,
        clientId: selectedClientForPayment.clientId._id,
        ...clientExpenseForm
      });
      toast.success('Client expense added successfully');
      setShowClientExpenseModal(false);
      setClientExpenseForm({
        amount: '',
        paidBy: 'self',
        expenseType: 'Other',
        description: '',
        paymentDate: new Date().toISOString().split('T')[0]
      });
      loadClientExpenses(selectedClientForPayment.clientId._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    }
  };
  
  const handleDeleteClientPayment = async (paymentId, clientId) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await clientPaymentAPI.delete(paymentId);
      toast.success('Payment deleted');
      loadClientPayments(clientId);
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };
  
  const handleDeleteClientExpense = async (expenseId, clientId) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await clientExpenseAPI.delete(expenseId);
      toast.success('Expense deleted');
      loadClientExpenses(clientId);
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };
  
  const handleDeleteBalanceMemo = async (memoId) => {
    if (!confirm('Are you sure you want to delete this balance memo?')) return;
    try {
      await balanceMemoAPI.delete(memoId);
      toast.success('Balance memo deleted');
      loadBalanceMemos();
    } catch (error) {
      toast.error('Failed to delete balance memo');
    }
  };
  
  const loadClientPOD = async (clientId) => {
    try {
      const response = await clientPODAPI.getByTripAndClient(params.id, clientId);
      setClientPODs(prev => ({
        ...prev,
        [clientId]: response.data.data
      }));
    } catch (error) {
      console.error('Failed to load client POD:', error);
    }
  };
  
  const handleOpenPODModal = (client) => {
    setSelectedClientForPOD(client);
    const existingPOD = clientPODs[client.clientId?._id];
    if (existingPOD) {
      setPodForm({
        status: existingPOD.status || 'pod_pending',
        document: null,
        notes: existingPOD.notes || ''
      });
    } else {
      setPodForm({
        status: 'pod_pending',
        document: null,
        notes: ''
      });
    }
    setShowPODModal(true);
  };
  
  const handleNextPODStep = async (clientId) => {
    const currentStep = currentPODStep[clientId] || 0;
    const statuses = ['pod_pending', 'pod_received', 'pod_submitted', 'settled'];
    if (currentStep < statuses.length - 1) {
      const newStep = currentStep + 1;
      const newStatus = statuses[newStep];
      
      // Update step in UI
      setCurrentPODStep(prev => ({
        ...prev,
        [clientId]: newStep
      }));
      
      // Update status in database
      try {
        const existingPOD = clientPODs[clientId];
        if (existingPOD) {
          await clientPODAPI.update(existingPOD._id, {
            status: newStatus,
            notes: existingPOD.notes || ''
          });
          toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
          loadClientPOD(clientId);
        } else {
          // Create POD if doesn't exist
          await clientPODAPI.create({
            tripId: params.id,
            clientId: clientId,
            status: newStatus,
            notes: ''
          });
          toast.success(`POD created with status ${getStatusLabel(newStatus)}`);
          loadClientPOD(clientId);
        }
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
        // Revert step on error
        setCurrentPODStep(prev => ({
          ...prev,
          [clientId]: currentStep
        }));
      }
    }
  };
  
  const handlePreviousPODStep = async (clientId) => {
    const currentStep = currentPODStep[clientId] || 0;
    const statuses = ['pod_pending', 'pod_received', 'pod_submitted', 'settled'];
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      const newStatus = statuses[newStep];
      
      // Update step in UI
      setCurrentPODStep(prev => ({
        ...prev,
        [clientId]: newStep
      }));
      
      // Update status in database
      try {
        const existingPOD = clientPODs[clientId];
        if (existingPOD) {
          await clientPODAPI.update(existingPOD._id, {
            status: newStatus,
            notes: existingPOD.notes || ''
          });
          toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
          loadClientPOD(clientId);
        }
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
        // Revert step on error
        setCurrentPODStep(prev => ({
          ...prev,
          [clientId]: currentStep
        }));
      }
    }
  };
  
  const toggleUploadSection = (clientId) => {
    setShowUploadSection(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };
  
  const handleInlineDocumentUpload = async (clientId, file, notes) => {
    try {
      const existingPOD = clientPODs[clientId];
      const currentStep = currentPODStep[clientId] || 0;
      const statuses = ['pod_pending', 'pod_received', 'pod_submitted', 'settled'];
      const currentStatus = statuses[currentStep];
      
      if (existingPOD) {
        // Update existing POD
        await clientPODAPI.update(existingPOD._id, {
          status: currentStatus,
          notes: notes
        });
        
        // Upload document with status
        if (file) {
          const formData = new FormData();
          formData.append('document', file);
          formData.append('status', currentStatus);
          formData.append('notes', notes || '');
          await clientPODAPI.uploadDocument(existingPOD._id, formData);
        }
        
        toast.success('Document uploaded successfully');
      } else {
        // Create new POD
        const response = await clientPODAPI.create({
          tripId: params.id,
          clientId: clientId,
          status: currentStatus,
          notes: notes
        });
        
        // Upload document with status
        if (file && response.data.data._id) {
          const formData = new FormData();
          formData.append('document', file);
          formData.append('status', currentStatus);
          formData.append('notes', notes || '');
          await clientPODAPI.uploadDocument(response.data.data._id, formData);
        }
        
        toast.success('POD created successfully');
      }
      
      // Reset form and hide upload section
      setPodForm({ status: currentStatus, document: null, notes: '' });
      setShowUploadSection(prev => ({ ...prev, [clientId]: false }));
      loadClientPOD(clientId);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
  };
  
  const handlePODSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientForPOD?.clientId?._id) return;
    
    try {
      const clientId = selectedClientForPOD.clientId._id;
      const existingPOD = clientPODs[clientId];
      
      if (existingPOD) {
        // Update existing POD status
        await clientPODAPI.update(existingPOD._id, {
          status: podForm.status,
          notes: podForm.notes
        });
        
        // Upload document if provided - with status
        if (podForm.document) {
          const formData = new FormData();
          formData.append('document', podForm.document);
          formData.append('status', podForm.status);
          formData.append('notes', podForm.notes || '');
          await clientPODAPI.uploadDocument(existingPOD._id, formData);
        }
        
        toast.success('POD updated successfully');
      } else {
        // Create new POD
        const response = await clientPODAPI.create({
          tripId: params.id,
          clientId: clientId,
          status: podForm.status,
          notes: podForm.notes
        });
        
        // Upload document if provided - with status
        if (podForm.document && response.data.data._id) {
          const formData = new FormData();
          formData.append('document', podForm.document);
          formData.append('status', podForm.status);
          formData.append('notes', podForm.notes || '');
          await clientPODAPI.uploadDocument(response.data.data._id, formData);
        }
        
        toast.success('POD created successfully');
      }
      
      setShowPODModal(false);
      setPodForm({ status: 'pod_pending', document: null, notes: '' });
      loadClientPOD(clientId);
    } catch (error) {
      console.error('Error saving POD:', error);
      toast.error(error.response?.data?.message || 'Failed to save POD');
    }
  };
  
  const handleDeletePOD = async (podId, clientId) => {
    if (!confirm('Are you sure you want to delete this POD?')) return;
    try {
      await clientPODAPI.delete(podId);
      toast.success('POD deleted');
      loadClientPOD(clientId);
    } catch (error) {
      toast.error('Failed to delete POD');
    }
  };
  
  const handleDeleteDocument = async (podId, documentId, clientId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await clientPODAPI.deleteDocument(podId, documentId);
      toast.success('Document deleted');
      loadClientPOD(clientId);
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };
  
  const getDocumentsByStatus = (pod, status) => {
    if (!pod || !pod.documents) return [];
    return pod.documents.filter(doc => doc.status === status);
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      pod_pending: 'POD Pending',
      pod_received: 'POD Received',
      pod_submitted: 'POD Submitted',
      settled: 'Settled'
    };
    return labels[status] || status;
  };
  
  const handlePreviewDocument = (documentUrl) => {
    setPreviewDocument(documentUrl);
  };
  
  const closePreview = () => {
    setPreviewDocument(null);
  };
  
  const handleOpenManagePODModal = () => {
    // Pre-fill with podBalance if actualPodAmt is 0 (first time)
    const defaultAmount = trip.actualPodAmt === 0 ? trip.podBalance : 0;
    setActualPodForm({ 
      actualPodAmt: defaultAmount || 0,
      paymentType: 'cash',
      notes: ''
    });
    setShowManagePODModal(true);
  };
  
  const handleSubmitActualPOD = async (e) => {
    e.preventDefault();
    try {
      await tripAPI.updateActualPod(
        params.id, 
        actualPodForm.actualPodAmt,
        actualPodForm.paymentType,
        actualPodForm.notes
      );
      toast.success('POD amount submitted successfully');
      setShowManagePODModal(false);
      loadTripDetails();
    } catch (error) {
      console.error('Error updating actual POD:', error);
      toast.error(error.response?.data?.message || 'Failed to submit POD');
    }
  };
  
  const getPODStatusColor = (status) => {
    const colors = {
      pod_pending: 'bg-orange-100 text-orange-800',
      pod_received: 'bg-purple-100 text-purple-800',
      pod_submitted: 'bg-yellow-100 text-yellow-800',
      settled: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  const handleDownloadReceipt = () => {
    if (!trip) {
      toast.error('Trip data not available');
      return;
    }
    
    if (!isFleetOwned) {
      toast.error('Receipt is only available for fleet-owned vehicles');
      return;
    }
    
    // Open preview modal
    setShowReceiptPreview(true);
  };
  
  const getClientPaymentTotal = (clientId) => {
    const payments = clientPayments[clientId] || [];
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  };
  
  const getClientExpenseTotal = (clientId) => {
    const expenses = clientExpenses[clientId] || [];
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
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

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Trip not found</p>
      </div>
    );
  }

  const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
  
  // Calculate Total Fleet Owner Payment (TruckHireCost + Expenses)
  const totalFleetOwnerPayment = isFleetOwned 
    ? (trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0) + totalExpenses
    : 0;
  
  // Calculate Fleet Owner Balance - Image wala formula
  // Pending = (TruckHireCost + Expenses) - Commission - POD - Advances
  const commission = trip.commissionAmount || 0;
  const balancePOD = trip.podBalance || 0;
  const fleetOwnerBalance = totalFleetOwnerPayment - commission - balancePOD - totalAdvances;
  
  // Calculate Real-Time Profit for Self-Owned Vehicles
  // For self-owned: Profit = Revenue - Vehicle Expenses - Driver Advances
  const realTimeProfit = isFleetOwned 
    ? trip.profitLoss // Use backend calculation for fleet-owned
    : trip.totalClientRevenue - totalExpenses - totalAdvances; // Real-time calculation for self-owned

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/trips')}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Trips</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trip.tripNumber}</h1>
            <p className="text-gray-600">Trip Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Show Manage POD only for fleet-owned vehicles */}
          {isFleetOwned && (
            <button
              onClick={handleOpenManagePODModal}
              className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Manage POD</span>
            </button>
          )}
          <button
            onClick={() => router.push(`/dashboard/trips/${params.id}/edit`)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Trip</span>
          </button>
          <button className="btn btn-primary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="btn bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2">
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Vehicle Overview with Trip Information - Full Width */}
          {/* Vehicle Overview with Trip Information */}
          <div className="card">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Vehicle Details */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-blue-600" />
                  Vehicle Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Number</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {trip.vehicleId?.vehicleNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {trip.vehicleId?.brand} {trip.vehicleId?.model || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {trip.vehicleId?.capacityTons || 0} tons
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ownership</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {trip.vehicleId?.ownershipType === 'self_owned' ? '🚛 Own Vehicle' : '🤝 Fleet Owner'}
                    </p>
                  </div>
                  
                  {/* Show Fleet Owner Details if Fleet Owned */}
                  {isFleetOwned && trip.vehicleId?.fleetOwnerId && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Fleet Owner Name</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {trip.vehicleId.fleetOwnerId.fullName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fleet Owner Contact</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {trip.vehicleId.fleetOwnerId.contact}
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Show Driver Details if Self Owned */}
                  {!isFleetOwned && trip.driverId && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Driver Name</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {trip.driverId.fullName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Driver Contact</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {trip.driverId.contact}
                        </p>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-600">Total Clients</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {trip.clients?.length || 0}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Trip Status</p>
                    <div className="mt-1">
                      <select
                        value={tripStatus}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="input text-sm"
                      >
                        <option value="scheduled">Trip Scheduled</option>
                        <option value="in_progress">Trip Started</option>
                        <option value="completed">Trip Completed</option>
                        <option value="cancelled">POD Received</option>
                        <option value="cancelled">POD Submitted</option>
                        <option value="cancelled">Settled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right: Trip Information */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Trip Information
                </h3>
                <div className="space-y-3">
                  {/* Total Freight */}
                  <div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Freight</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(isFleetOwned ? totalFleetOwnerPayment : trip.totalClientRevenue)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {isFleetOwned 
                        ? `Formula: Hire Cost (${formatCurrency(trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0)}) + Expenses (${formatCurrency(totalExpenses)})`
                        : `Formula: Sum of all client rates`
                      }
                    </p>
                  </div>

                  {/* Commission */}
                  {isFleetOwned && (
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Commission</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(trip.commissionAmount || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Type: {trip.commissionType === 'from_fleet_owner' ? 'From Fleet Owner (-)' : trip.commissionType === 'to_fleet_owner' ? 'To Fleet Owner (+)' : 'None'}
                      </p>
                    </div>
                  )}

                  {/* POD */}
                  {isFleetOwned && (
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">POD</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(trip.podBalance)} / {formatCurrency(trip.actualPodAmt || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Remaining / Original (Deducted from fleet owner payment)
                      </p>
                    </div>
                  )}

                  {/* Paid Balance */}
                  {isFleetOwned && (
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Paid Balance</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(totalAdvances)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Total advances paid to fleet owner
                      </p>
                    </div>
                  )}

                  {/* Pending Balance */}
                  {isFleetOwned && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-900">Pending Balance</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(fleetOwnerBalance)}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1 italic font-medium">
                        Formula: (Hire + Expenses) - Commission - POD - Advances
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        = ({formatCurrency(trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0)} + {formatCurrency(totalExpenses)}) - {formatCurrency(commission)} - {formatCurrency(balancePOD)} - {formatCurrency(totalAdvances)}
                      </p>
                    </div>
                  )}

                  {/* Profit / Loss */}
                  <div className="pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-900">Profit / Loss</span>
                      <span className={`text-lg font-bold ${
                        realTimeProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {realTimeProfit >= 0 ? '+' : ''}{formatCurrency(realTimeProfit)}
                      </span>
                    </div>
                    {isFleetOwned ? (
                      <>
                        <p className="text-xs text-blue-600 mt-1 italic font-medium">
                          Formula: Revenue - Hire  + Commission + POD
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          = {formatCurrency(trip.totalClientRevenue)} - {formatCurrency(trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0)}  {trip.commissionType === 'from_fleet_owner' ? '+' : trip.commissionType === 'to_fleet_owner' ? '-' : '+'} {formatCurrency(commission)} + {formatCurrency(trip.podBalance)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-blue-600 mt-1 italic font-medium">
                          Formula: Revenue - Vehicle Expenses - Driver Advances
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          = {formatCurrency(trip.totalClientRevenue)} - {formatCurrency(totalExpenses)} - {formatCurrency(totalAdvances)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Tracking Section */}
            {isFleetOwned ? (
              /* Fleet Owner Financial Tracking - Only for Fleet Owned */
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Fleet Owner Financial Tracking
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Fleet Owner: <span className="font-semibold">{trip.vehicleId?.fleetOwnerId?.fullName || 'N/A'}</span>
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Fleet Owner Balance: {formatCurrency(fleetOwnerBalance)} 
                  <span className="ml-2 text-blue-600 cursor-pointer" onClick={() => setShowAdvanceModal(true)}>
                    Click To add
                  </span>
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 mb-1">Total Fleet Owner</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatCurrency(totalFleetOwnerPayment)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Hire + Expenses</p>
                  </div>

                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600 mb-1">Total Expenses</p>
                    <p className="text-xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1">Total Advances</p>
                    <p className="text-xl font-bold text-purple-700">{formatCurrency(totalAdvances)}</p>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="flex-1 btn bg-red-600 text-white hover:bg-red-700 text-sm flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Expense</span>
                  </button>
                  <button
                    onClick={() => setShowAdvanceModal(true)}
                    className="flex-1 btn bg-green-600 text-white hover:bg-green-700 text-sm flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Advance</span>
                  </button>
                  <button 
                    onClick={handleDownloadReceipt}
                    className="flex-1 btn btn-primary text-sm flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Receipt</span>
                  </button>
                </div>
                
                {/* Expenses & Advances Tabs - Inside Fleet Owner Section */}
                <div className="mt-6">
                  <div className="border-b border-gray-200 mb-4">
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => setActiveTab('expenses')}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === 'expenses' 
                            ? 'text-blue-600 border-b-2 border-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Expenses ({expenses.length})
                      </button>
                      <button 
                        onClick={() => setActiveTab('advances')}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === 'advances' 
                            ? 'text-blue-600 border-b-2 border-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Advances ({advances.length})
                      </button>
                    </div>
                  </div>
                  
                  {/* Expenses Tab Content */}
                  {activeTab === 'expenses' && (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {expenses.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500 text-sm">No expenses recorded</p>
                          </div>
                        ) : (
                          expenses.map((expense) => (
                            <div key={expense._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <p className="text-sm font-medium text-gray-900 capitalize">{expense.expenseType}</p>
                                <p className="text-xs text-gray-500">{expense.description}</p>
                                <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
                                {expense.createdBy && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Added by: {expense.createdBy.fullName || expense.createdBy.username}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-red-600">
                                  {formatCurrency(expense.amount)}
                                </span>
                                <button
                                  onClick={() => handleDeleteExpense(expense._id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {expenses.length > 0 && (
                        <div className="mt-4 pt-4 border-t flex justify-between">
                          <span className="text-sm font-semibold">Total Expenses:</span>
                          <span className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Advances Tab Content */}
                  {activeTab === 'advances' && (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {advances.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500 text-sm">No advance payments</p>
                          </div>
                        ) : (
                          advances.map((advance) => (
                            <div key={advance._id} className={`flex items-center justify-between p-3 rounded-lg border ${
                              advance.advanceType === 'pod_submission' 
                                ? 'bg-purple-50 border-purple-200' 
                                : 'bg-white border-gray-200'
                            }`}>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-medium text-gray-900 capitalize">{advance.paymentMethod}</p>
                                  {advance.advanceType === 'pod_submission' && (
                                    <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">
                                      POD
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{advance.description}</p>
                                <p className="text-xs text-gray-400">{formatDate(advance.date)}</p>
                                {advance.createdBy && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Added by: {advance.createdBy.fullName || advance.createdBy.username}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-green-600">
                                  {formatCurrency(advance.amount)}
                                </span>
                                {advance.advanceType !== 'pod_submission' ? (
                                  <button
                                    onClick={() => handleDeleteAdvance(advance._id)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Delete advance"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    className="text-gray-300 cursor-not-allowed"
                                    title="POD submissions cannot be deleted from here. Delete from POD history."
                                    disabled
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {advances.length > 0 && (
                        <div className="mt-4 pt-4 border-t flex justify-between">
                          <span className="text-sm font-semibold">Total Advances:</span>
                          <span className="text-lg font-bold text-green-600">{formatCurrency(totalAdvances)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Vehicle & Driver Financial Tracking - For Self-Owned */
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Vehicle & Driver Financial Tracking
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Driver: <span className="font-semibold">{trip.driverId?.fullName || 'Not Assigned'}</span>
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600 mb-1">Vehicle Expenses</p>
                    <p className="text-xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
                    <p className="text-xs text-gray-500 mt-1">Fuel, Toll, etc.</p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1">Driver Advances</p>
                    <p className="text-xl font-bold text-purple-700">{formatCurrency(totalAdvances)}</p>
                    <p className="text-xs text-gray-500 mt-1">Paid to driver</p>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="flex-1 btn bg-red-600 text-white hover:bg-red-700 text-sm flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Vehicle Expense</span>
                  </button>
                  <button
                    onClick={() => setShowAdvanceModal(true)}
                    className="flex-1 btn bg-green-600 text-white hover:bg-green-700 text-sm flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Driver Advance</span>
                  </button>
                </div>
                
                {/* Expenses & Advances Tabs - Inside Self-Owned Section */}
                <div className="mt-6">
                  <div className="border-b border-gray-200 mb-4">
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => setActiveTab('expenses')}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === 'expenses' 
                            ? 'text-blue-600 border-b-2 border-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Vehicle Expenses ({expenses.length})
                      </button>
                      <button 
                        onClick={() => setActiveTab('advances')}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === 'advances' 
                            ? 'text-blue-600 border-b-2 border-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Driver Advances ({advances.length})
                      </button>
                    </div>
                  </div>
                  
                  {/* Expenses Tab Content */}
                  {activeTab === 'expenses' && (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {expenses.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500 text-sm">No vehicle expenses recorded</p>
                          </div>
                        ) : (
                          expenses.map((expense) => (
                            <div key={expense._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <p className="text-sm font-medium text-gray-900 capitalize">{expense.expenseType}</p>
                                <p className="text-xs text-gray-500">{expense.description}</p>
                                <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
                                {expense.createdBy && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Added by: {expense.createdBy.fullName || expense.createdBy.username}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-red-600">
                                  {formatCurrency(expense.amount)}
                                </span>
                                <button
                                  onClick={() => handleDeleteExpense(expense._id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {expenses.length > 0 && (
                        <div className="mt-4 pt-4 border-t flex justify-between">
                          <span className="text-sm font-semibold">Total Vehicle Expenses:</span>
                          <span className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Advances Tab Content */}
                  {activeTab === 'advances' && (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {advances.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500 text-sm">No driver advances</p>
                          </div>
                        ) : (
                          advances.map((advance) => (
                            <div key={advance._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <p className="text-sm font-medium text-gray-900 capitalize">{advance.paymentMethod}</p>
                                <p className="text-xs text-gray-500">{advance.description}</p>
                                <p className="text-xs text-gray-400">{formatDate(advance.date)}</p>
                                {advance.createdBy && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Added by: {advance.createdBy.fullName || advance.createdBy.username}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-green-600">
                                  {formatCurrency(advance.amount)}
                                </span>
                                <button
                                  onClick={() => handleDeleteAdvance(advance._id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete advance"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {advances.length > 0 && (
                        <div className="mt-4 pt-4 border-t flex justify-between">
                          <span className="text-sm font-semibold">Total Driver Advances:</span>
                          <span className="text-lg font-bold text-green-600">{formatCurrency(totalAdvances)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clients & Load Details */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Clients & Load Details
            </h3>
            <p className="text-sm text-gray-600 mb-4">Individual client details and their respective loads</p>

            {/* Client Tabs */}
            {trip.clients && trip.clients.length > 1 && (
              <div className="border-b border-gray-200 mb-4">
                <div className="flex space-x-2 overflow-x-auto">
                  {trip.clients.map((client, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedClientIndex(index)}
                      className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                        selectedClientIndex === index
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {client.clientId?.fullName || client.clientId?.companyName || `Client ${index + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Display Selected Client */}
            {trip.clients && trip.clients[selectedClientIndex] && (() => {
              const client = trip.clients[selectedClientIndex];
              const index = selectedClientIndex;
              return (
              <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">GL</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {client.clientId?.fullName || 'N/A'}
                      </h4>
                      {client.clientId?.companyName && (
                        <p className="text-sm text-gray-500">{client.clientId.companyName}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Rate:</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(client.clientRate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                      {client.originCity?.cityName || 'N/A'}
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                      {client.destinationCity?.cityName || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Load Description</p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.specialInstructions || 'NA'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Load Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(client.loadDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Weight & Quantity</p>
                    <p className="text-sm font-medium text-gray-900">0 tons • 1 units</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type & Packaging</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {client.packagingType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`badge ${getStatusColor(trip.status)}`}>
                      {trip.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Financial Summary with Formulas */}
                <div className="mt-4 pt-4 border-t bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                    Financial Summary
                  </h5>
                  
                  {/* Stats in one line */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* Client Rate */}
                    <div className="flex-1 min-w-[120px] bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-600">Client Rate</p>
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(client.clientRate)}</p>
                    </div>
                    
                    {/* Hire Cost (Fleet-Owned Only) */}
                    {isFleetOwned && (
                      <div className="flex-1 min-w-[120px] bg-white p-2 rounded border border-gray-200">
                        <p className="text-xs text-gray-600">Hire Cost</p>
                        <p className="text-sm font-bold text-purple-600">{formatCurrency(client.truckHireCost)}</p>
                      </div>
                    )}
                    
                    {/* Adjustment */}
                    <div className="flex-1 min-w-[120px] bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-600">Adjustment</p>
                      <p className="text-sm font-bold text-orange-600">{formatCurrency(client.adjustment)}</p>
                    </div>
                    
                    {/* Payments Received */}
                    <div className="flex-1 min-w-[120px] bg-white p-2 rounded border border-green-200">
                      <p className="text-xs text-green-600">Payments Received</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(getClientPaymentTotal(client.clientId?._id))}
                      </p>
                    </div>
                    
                    {/* Client Expenses */}
                    <div className="flex-1 min-w-[120px] bg-white p-2 rounded border border-red-200">
                      <p className="text-xs text-red-600">Client Expenses</p>
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(getClientExpenseTotal(client.clientId?._id))}
                      </p>
                    </div>
                  </div>
                  
                  {/* Due Balance and Client Profit in one line */}
                  <div className="flex gap-3">
                    {/* Due Balance */}
                    <div className="flex-1 bg-white p-3 rounded-lg border-2 border-blue-300">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900 flex items-center">
                          <Wallet className="w-3 h-3 mr-1 text-blue-600" />
                          Due Balance
                        </span>
                        <span className={`text-lg font-bold ${
                          (client.clientRate - getClientPaymentTotal(client.clientId?._id) + getClientExpenseTotal(client.clientId?._id)) >= 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {formatCurrency(
                            client.clientRate -  getClientPaymentTotal(client.clientId?._id) + getClientExpenseTotal(client.clientId?._id)
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        Rate - Payments + Expenses
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(client.clientRate)}- {formatCurrency(getClientPaymentTotal(client.clientId?._id))} + {formatCurrency(getClientExpenseTotal(client.clientId?._id))}
                      </div>
                    </div>
                    
                    {/* Client Profit (Fleet-Owned Only) */}
                    {isFleetOwned && (
                      <div className="flex-1 bg-white p-3 rounded-lg border-2 border-green-300">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-900 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                            Client Profit
                          </span>
                          <span className={`text-lg font-bold ${
                            (client.clientRate - client.truckHireCost ) >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {(client.clientRate - client.truckHireCost ) >= 0 ? '+' : ''}
                            {formatCurrency(client.clientRate - client.truckHireCost )}
                          </span>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          Rate - Hire Cost - Adj
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(client.clientRate)} - {formatCurrency(client.truckHireCost)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-semibold text-green-700 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Payments Received
                    </h5>
                    <button 
                      onClick={() => handleOpenClientPaymentModal(client)}
                      className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  
                  {/* Display payments */}
                  {clientPayments[client.clientId?._id]?.length > 0 && (
                    <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                      {clientPayments[client.clientId._id].map((payment) => (
                        <div key={payment._id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900 capitalize">{payment.paymentMethod}</p>
                            <p className="text-xs text-gray-500">{payment.notes || payment.purpose}</p>
                            <p className="text-xs text-gray-400">{formatDate(payment.paymentDate)}</p>
                            {payment.createdBy && (
                              <p className="text-xs text-blue-600 mt-1">
                                Added by: {payment.createdBy.fullName || payment.createdBy.username}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                            <button
                              onClick={() => handleDeleteClientPayment(payment._id, client.clientId._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-semibold text-red-700 flex items-center">
                      <X className="w-4 h-4 mr-2" />
                      Client Expenses
                    </h5>
                    <button 
                      onClick={() => handleOpenClientExpenseModal(client)}
                      className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  
                  {/* Display expenses */}
                  {clientExpenses[client.clientId?._id]?.length > 0 && (
                    <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                      {clientExpenses[client.clientId._id].map((expense) => (
                        <div key={expense._id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900">{expense.expenseType}</p>
                            <p className="text-xs text-gray-500">{expense.description}</p>
                            <p className="text-xs text-gray-400">{formatDate(expense.paymentDate)} • {expense.paidBy}</p>
                            {expense.createdBy && (
                              <p className="text-xs text-blue-600 mt-1">
                                Added by: {expense.createdBy.fullName || expense.createdBy.username}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-red-600">
                              {formatCurrency(expense.amount)}
                            </span>
                            <button
                              onClick={() => handleDeleteClientExpense(expense._id, client.clientId._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download Receipt Button */}
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={async () => {
                      try {
                        // Fetch client payments
                        let payments = [];
                        try {
                          const paymentsResponse = await clientPaymentAPI.getByTripAndClient(params.id, client.clientId._id);
                          payments = paymentsResponse.data.data || [];
                        } catch (error) {
                          console.log('No payments found');
                        }
                        
                        // Prepare trip data for receipt
                        const receiptTripData = {
                          tripNumber: trip.tripNumber,
                          loadDate: client.loadDate,
                          vehicleNumber: trip.vehicleId?.vehicleNumber,
                          vehicleId: trip.vehicleId,
                          clientRate: client.clientRate,
                          paid: getClientPaymentTotal(client.clientId._id),
                          expenses: getClientExpenseTotal(client.clientId._id),
                          balance: client.clientRate - client.adjustment - getClientPaymentTotal(client.clientId._id) + getClientExpenseTotal(client.clientId._id),
                          originCity: client.originCity,
                          destinationCity: client.destinationCity,
                          packagingType: client.packagingType
                        };
                        
                        await generateClientReceipt(receiptTripData, client.clientId, payments, formatCurrency);
                      } catch (error) {
                        console.error('Error:', error);
                        toast.error('Failed to generate receipt');
                      }
                    }}
                    className="w-full btn bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Receipt</span>
                  </button>
                </div>

                {/* POD Management Section */}
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-t-lg border-2 border-gray-200 border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h5 className="text-base font-bold text-gray-900">POD Management System</h5>
                          <p className="text-xs text-gray-600">Track your Proof of Delivery status in real-time</p>
                        </div>
                      </div>
                      <span className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                        {clientPODs[client.clientId?._id]?.status?.replace('_', ' ').toUpperCase() || 'POD PENDING'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Timeline */}
                  <div className="bg-white p-6 border-2 border-gray-200 border-t-0 border-b-0">
                    <div className="flex items-center justify-between relative">
                      {/* Background Line */}
                      <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 z-0"></div>
                      
                      {/* POD Pending */}
                      <div className="flex flex-col items-center flex-1 relative z-10">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                          (currentPODStep[client.clientId?._id] || 0) >= 0
                            ? 'bg-orange-500 text-white shadow-lg scale-110' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Clock className="w-7 h-7" />
                        </div>
                        <p className="text-xs font-bold mt-3 text-center text-gray-700">POD<br/>Pending</p>
                      </div>
                      
                      {/* POD Received */}
                      <div className="flex flex-col items-center flex-1 relative z-10">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                          (currentPODStep[client.clientId?._id] || 0) >= 1
                            ? 'bg-purple-500 text-white shadow-lg scale-110' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Package className="w-7 h-7" />
                        </div>
                        <p className="text-xs font-bold mt-3 text-center text-gray-700">POD<br/>Received</p>
                      </div>
                      
                      {/* POD Submitted */}
                      <div className="flex flex-col items-center flex-1 relative z-10">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                          (currentPODStep[client.clientId?._id] || 0) >= 2
                            ? 'bg-yellow-400 text-white shadow-lg scale-110' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Send className="w-7 h-7" />
                        </div>
                        <p className="text-xs font-bold mt-3 text-center text-gray-700">POD<br/>Submitted</p>
                      </div>
                      
                      {/* Settled */}
                      <div className="flex flex-col items-center flex-1 relative z-10">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                          (currentPODStep[client.clientId?._id] || 0) >= 3
                            ? 'bg-green-500 text-white shadow-lg scale-110' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Wallet className="w-7 h-7" />
                        </div>
                        <p className="text-xs font-bold mt-3 text-center text-gray-700">Settled</p>
                      </div>
                    </div>
                    
                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-center space-x-4 mt-6">
                      <button
                        onClick={() => handlePreviousPODStep(client.clientId?._id)}
                        disabled={(currentPODStep[client.clientId?._id] || 0) === 0}
                        className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                          (currentPODStep[client.clientId?._id] || 0) === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Previous</span>
                      </button>
                      
                      <button
                        onClick={() => handleNextPODStep(client.clientId?._id)}
                        disabled={(currentPODStep[client.clientId?._id] || 0) === 3}
                        className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                          (currentPODStep[client.clientId?._id] || 0) === 3
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <span>Next</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Inline Upload Section */}
                  <div className="bg-white p-4 border-2 border-gray-200 border-t-0 border-b-0">
                    <button
                      onClick={() => toggleUploadSection(client.clientId?._id)}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-bold text-gray-900">Upload Document</span>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${
                        showUploadSection[client.clientId?._id] ? 'rotate-90' : ''
                      }`} />
                    </button>
                    
                    {showUploadSection[client.clientId?._id] && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const file = formData.get('document');
                          const notes = formData.get('notes');
                          handleInlineDocumentUpload(client.clientId?._id, file, notes);
                        }}>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Current Status: {getStatusLabel(['pod_pending', 'pod_received', 'pod_submitted', 'settled'][currentPODStep[client.clientId?._id] || 0])}
                              </label>
                              <input
                                type="file"
                                name="document"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">Accepted: PDF, JPG, PNG (Max 10MB)</p>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (Optional)</label>
                              <textarea
                                name="notes"
                                rows="2"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Add notes about this document..."
                              ></textarea>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => toggleUploadSection(client.clientId?._id)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 text-sm font-semibold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg"
                              >
                                Upload Document
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                  
                  {/* POD Documents Section */}
                  <div className="bg-white p-4 rounded-b-lg border-2 border-gray-200 border-t-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-5 h-5 text-blue-600" />
                        <h6 className="text-sm font-bold text-gray-900">POD Documents</h6>
                        {clientPODs[client.clientId?._id]?.documents?.length > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                            {clientPODs[client.clientId._id].documents.length}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => toggleUploadSection(client.clientId?._id)}
                        className="btn bg-blue-600 text-white hover:bg-blue-700 text-sm px-6 py-2 flex items-center space-x-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                      </button>
                    </div>
                    
                    {clientPODs[client.clientId?._id]?.documents && clientPODs[client.clientId._id].documents.length > 0 ? (
                      <div className="space-y-4">
                        {/* Group documents by status */}
                        {['pod_pending', 'pod_received', 'pod_submitted', 'settled'].map((status) => {
                          const docs = getDocumentsByStatus(clientPODs[client.clientId._id], status);
                          if (docs.length === 0) return null;
                          
                          return (
                            <div key={status} className="border-l-4 border-blue-500 pl-4">
                              <h6 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                {getStatusLabel(status)} ({docs.length})
                              </h6>
                              <div className="space-y-2">
                                {docs.map((doc) => (
                                  <div key={doc._id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:border-blue-400 transition-all duration-300 transform hover:scale-[1.02]">
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                          {getStatusLabel(doc.status)} Document
                                        </p>
                                        {doc.notes && (
                                          <p className="text-xs text-gray-600 truncate">{doc.notes}</p>
                                        )}
                                        <div className="flex items-center space-x-2 mt-1">
                                          <p className="text-xs text-gray-400">
                                            {new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                          {doc.uploadedBy && (
                                            <>
                                              <span className="text-gray-300">•</span>
                                              <p className="text-xs text-blue-600">
                                                {doc.uploadedBy.fullName || doc.uploadedBy.username}
                                              </p>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                      <button
                                        onClick={() => handlePreviewDocument(doc.documentUrl)}
                                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-300"
                                        title="Preview"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <a 
                                        href={doc.documentUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-300"
                                        title="Download"
                                      >
                                        <Download className="w-4 h-4" />
                                      </a>
                                      <button
                                        onClick={() => handleDeleteDocument(clientPODs[client.clientId._id]._id, doc._id, client.clientId._id)}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-300"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-300">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3 animate-bounce" />
                        <p className="text-sm font-semibold text-gray-700 mb-1">No documents uploaded yet</p>
                        <p className="text-xs text-gray-500">Click "Upload" to add POD documents</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })()}
            
            {/* Collection Memos & Balance Memos - Below all clients */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              {/* Collection Memos */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-blue-900 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Collection Memos ({collectionMemos.length})
                  </h4>
                  <button 
                    onClick={() => {
                      if (trip.clients && trip.clients.length > 0) {
                        setSelectedClientForMemo(trip.clients[0]);
                        setShowCollectionMemoModal(true);
                      } else {
                        toast.error('No clients found for this trip');
                      }
                    }}
                    className="btn btn-primary text-xs px-3 py-1 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create</span>
                  </button>
                </div>
                
                {collectionMemos.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No collection memos yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {collectionMemos.map((memo) => (
                      <div key={memo._id} className="p-3 bg-white rounded border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{memo.collectionNumber}</p>
                            <p className="text-xs text-gray-600">{memo.msName}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditMemo(memo)}
                              className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded"
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCollectionMemo(memo._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>From: {memo.from} → To: {memo.to}</p>
                          <p>Balance: ₹{memo.balance}</p>
                          <p className="text-gray-400">{memo.date}</p>
                          {memo.createdBy && (
                            <p className="text-blue-600 mt-1">
                              Created by: {memo.createdBy.fullName || memo.createdBy.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Balance Memos */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-green-900 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Balance Memos
                  </h4>
                  <button 
                    onClick={() => {
                      if (trip.clients && trip.clients.length > 0) {
                        setSelectedClientForMemo(trip.clients[0]);
                        setShowBalanceMemoModal(true);
                      } else {
                        toast.error('No clients found for this trip');
                      }
                    }}
                    className="btn bg-green-600 text-white hover:bg-green-700 text-xs px-3 py-1 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create</span>
                  </button>
                </div>
                
                {balanceMemos.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No balance memos yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {balanceMemos.map((memo) => (
                      <div key={memo._id} className="p-3 bg-white rounded border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Invoice: {memo.invoiceNumber}</p>
                            <p className="text-xs text-gray-600">{memo.customerName}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                // Handle view/download PDF
                                toast.info('PDF download coming soon');
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-600 rounded"
                              title="Download PDF"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteBalanceMemo(memo._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>Vehicle: {memo.vehicleNumber}</p>
                          <p>From: {memo.from} → To: {memo.to}</p>
                          <p className="font-semibold text-green-700">Total Payable: ₹{memo.totalPayable}</p>
                          <p className="text-gray-400">{memo.date}</p>
                          {memo.createdBy && (
                            <p className="text-blue-600 mt-1">
                              Created by: {memo.createdBy.fullName || memo.createdBy.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trip Expenses - For Self-Owned Vehicles */}
          {!isFleetOwned && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                  Trip Expenses
                </h3>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="btn bg-red-600 text-white hover:bg-red-700 text-sm flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Expense</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Track fuel, toll, and other trip expenses</p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {expenses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 text-sm">No expenses recorded</p>
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">{expense.expenseType}</p>
                        <p className="text-xs text-gray-500">{expense.description}</p>
                        <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(expense.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {expenses.length > 0 && (
                <div className="mt-4 pt-4 border-t flex justify-between">
                  <span className="text-sm font-semibold">Total Expenses:</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
              )}
            </div>
          )}

          {/* POD Documents */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              POD Documents
            </h3>
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No documents uploaded</p>
              <button className="mt-3 btn btn-primary text-sm">
                Upload Document
              </button>
            </div>
          </div>

          {/* Signed */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Signed</h3>
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No signature</p>
            </div>
          </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 flex items-center">
                <span className="mr-2">⚠️</span>
                {isFleetOwned ? 'Add Fleet Owner Expense' : 'Add Vehicle Expense'}
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="input"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Reason</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="input"
                  placeholder="Enter reason for expense"
                />
              </div>
              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  value={expenseForm.additionalNotes || ''}
                  onChange={(e) => setExpenseForm({...expenseForm, additionalNotes: e.target.value})}
                  className="input"
                  rows="3"
                  placeholder="Additional details about the expense"
                ></textarea>
              </div>
              <div>
                <label className="label">Receipt Number (Optional)</label>
                <input
                  type="text"
                  value={expenseForm.receiptNumber || ''}
                  onChange={(e) => setExpenseForm({...expenseForm, receiptNumber: e.target.value})}
                  className="input"
                  placeholder="Enter receipt/bill number"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  value={expenseForm.expenseType}
                  onChange={(e) => setExpenseForm({...expenseForm, expenseType: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Select category</option>
                  <option value="fuel">🛢️ Fuel</option>
                  <option value="toll">🛣️ Toll</option>
                  <option value="loading">📦 Loading</option>
                  <option value="unloading">📤 Unloading</option>
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn bg-red-600 text-white hover:bg-red-700">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-600 flex items-center">
                <span className="mr-2">💰</span>
                {isFleetOwned ? 'Add Fleet Owner Advance Payment' : 'Add Driver Advance Payment'}
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAdvance} className="space-y-4">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={advanceForm.date}
                  onChange={(e) => setAdvanceForm({...advanceForm, date: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Reason</label>
                <input
                  type="text"
                  value={advanceForm.description}
                  onChange={(e) => setAdvanceForm({...advanceForm, description: e.target.value})}
                  className="input"
                  placeholder={isFleetOwned ? "Enter reason for advance payment" : "Enter reason for driver advance"}
                />
              </div>
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({...advanceForm, amount: e.target.value})}
                  className="input"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="label">Payment Type</label>
                <select
                  value={advanceForm.paymentMethod}
                  onChange={(e) => setAdvanceForm({...advanceForm, paymentMethod: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Select payment type</option>
                  <option value="cash">💵 Cash</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="upi">📱 UPI</option>
                  <option value="cheque">📝 Cheque</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn bg-green-600 text-white hover:bg-green-700">
                  Add Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Client Payment Modal */}
      {showClientPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-600 flex items-center">
                <span className="mr-2">💰</span>
                Add Client Payment
              </h3>
              <button onClick={() => setShowClientPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Client: <span className="font-semibold">{selectedClientForPayment?.clientId?.fullName}</span>
            </p>
            <form onSubmit={handleAddClientPayment} className="space-y-4">
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  value={clientPaymentForm.amount}
                  onChange={(e) => setClientPaymentForm({...clientPaymentForm, amount: e.target.value})}
                  className="input"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select
                  value={clientPaymentForm.paymentMethod}
                  onChange={(e) => setClientPaymentForm({...clientPaymentForm, paymentMethod: e.target.value})}
                  className="input"
                  required
                >
                  <option value="cash">💵 Cash</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="upi">📱 UPI</option>
                  <option value="cheque">📝 Cheque</option>
                  <option value="rtgs">🏦 RTGS</option>
                  <option value="neft">🏦 NEFT</option>
                  <option value="imps">📲 IMPS</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <input
                  type="text"
                  value={clientPaymentForm.notes}
                  onChange={(e) => setClientPaymentForm({...clientPaymentForm, notes: e.target.value})}
                  className="input"
                  placeholder="Payment notes"
                />
              </div>
              <div>
                <label className="label">Purpose</label>
                <select
                  value={clientPaymentForm.purpose}
                  onChange={(e) => setClientPaymentForm({...clientPaymentForm, purpose: e.target.value})}
                  className="input"
                  required
                >
                  <option value="General">General</option>
                  <option value="Fuel">🛢️ Fuel</option>
                  <option value="Toll">🛣️ Toll</option>
                  <option value="Loading">📦 Loading</option>
                </select>
              </div>
              <div>
                <label className="label">Payment Date</label>
                <input
                  type="date"
                  value={clientPaymentForm.paymentDate}
                  onChange={(e) => setClientPaymentForm({...clientPaymentForm, paymentDate: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowClientPaymentModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn bg-green-600 text-white hover:bg-green-700">
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Client Expense Modal */}
      {showClientExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 flex items-center">
                <span className="mr-2">⚠️</span>
                Add Client Expense
              </h3>
              <button onClick={() => setShowClientExpenseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Client: <span className="font-semibold">{selectedClientForPayment?.clientId?.fullName}</span>
            </p>
            <form onSubmit={handleAddClientExpense} className="space-y-4">
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  value={clientExpenseForm.amount}
                  onChange={(e) => setClientExpenseForm({...clientExpenseForm, amount: e.target.value})}
                  className="input"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="label">Paid By</label>
                <select
                  value={clientExpenseForm.paidBy}
                  onChange={(e) => setClientExpenseForm({...clientExpenseForm, paidBy: e.target.value})}
                  className="input"
                  required
                >
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                  <option value="self">Self</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  value={clientExpenseForm.expenseType}
                  onChange={(e) => setClientExpenseForm({...clientExpenseForm, expenseType: e.target.value})}
                  className="input"
                  required
                >
                  <option value="Fuel">🛢️ Fuel</option>
                  <option value="Loading Charges">📦 Loading Charges</option>
                  <option value="Unloading Charges">📤 Unloading Charges</option>
                  <option value="Toll">🛣️ Toll</option>
                  <option value="Halting Charges">🏨 Halting Charges</option>
                  <option value="Weight Charges">⚖️ Weight Charges</option>
                  <option value="Union Charges">👥 Union Charges</option>
                  <option value="Other">📋 Other (Add New)</option>
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={clientExpenseForm.description}
                  onChange={(e) => setClientExpenseForm({...clientExpenseForm, description: e.target.value})}
                  className="input"
                  rows="3"
                  placeholder="Additional details about the expense"
                ></textarea>
              </div>
              <div>
                <label className="label">Payment Date</label>
                <input
                  type="date"
                  value={clientExpenseForm.paymentDate}
                  onChange={(e) => setClientExpenseForm({...clientExpenseForm, paymentDate: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowClientExpenseModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn bg-red-600 text-white hover:bg-red-700">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Collection Memo Modal Component */}
      {selectedClientForMemo && (
        <CollectionMemoModal
          isOpen={showCollectionMemoModal}
          onClose={() => {
            setShowCollectionMemoModal(false);
            setSelectedClientForMemo(null);
            setEditingMemo(null);
          }}
          clientData={selectedClientForMemo}
          tripData={trip}
          clientPayments={getClientPaymentsArray(selectedClientForMemo?.clientId?._id)}
          editData={editingMemo}
          onSubmit={handleCreateCollectionMemo}
        />
      )}
      
      {/* Balance Memo Modal Component */}
      {selectedClientForMemo && (
        <BalanceMemoModal
          isOpen={showBalanceMemoModal}
          onClose={() => {
            setShowBalanceMemoModal(false);
            setSelectedClientForMemo(null);
          }}
          clientData={selectedClientForMemo}
          tripData={trip}
          clientPayments={getClientPaymentsArray(selectedClientForMemo?.clientId?._id)}
          clientExpenses={clientExpenses[selectedClientForMemo?.clientId?._id] || []}
          onSubmit={handleCreateBalanceMemo}
        />
      )}
      
      {/* Receipt Preview Modal */}
      {showReceiptPreview && trip && (
        <ReceiptPreviewModal
          trip={trip}
          fleetOwner={trip.vehicleId?.fleetOwnerId}
          expenses={expenses}
          advances={advances}
          onClose={() => setShowReceiptPreview(false)}
        />
      )}
      
      {/* POD Upload Modal */}
      {showPODModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-600 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {clientPODs[selectedClientForPOD?.clientId?._id] ? 'Update' : 'Upload'} POD
              </h3>
              <button onClick={() => setShowPODModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Client: <span className="font-semibold">{selectedClientForPOD?.clientId?.fullName}</span>
            </p>
            <form onSubmit={handlePODSubmit} className="space-y-4">
              <div>
                <label className="label">POD Status</label>
                <select
                  value={podForm.status}
                  onChange={(e) => setPodForm({...podForm, status: e.target.value})}
                  className="input"
                  required
                >
                  <option value="pod_pending">🟠 POD Pending</option>
                  <option value="pod_received">📥 POD Received</option>
                  <option value="pod_submitted">📤 POD Submitted</option>
                  <option value="pod_submitted">📤 POD Submitted</option>
                  <option value="settled">💰 Settled</option>
                </select>
              </div>
              <div>
                <label className="label">Upload Document</label>
                <input
                  type="file"
                  onChange={(e) => setPodForm({...podForm, document: e.target.files[0]})}
                  className="input"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500 mt-1">Accepted: PDF, JPG, PNG</p>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={podForm.notes}
                  onChange={(e) => setPodForm({...podForm, notes: e.target.value})}
                  className="input"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPODModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn bg-purple-600 text-white hover:bg-purple-700">
                  {clientPODs[selectedClientForPOD?.clientId?._id] ? 'Update' : 'Upload'} POD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Manage POD Modal */}
      {showManagePODModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-purple-600 flex items-center">
                  <Wallet className="w-5 h-5 mr-2" />
                  POD Details
                </h3>
                <button onClick={() => setShowManagePODModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Enter POD payment details for trip <span className="font-semibold">#{trip.tripNumber}</span>
              </p>
            </div>
            
            <div className="p-6">
              {/* POD Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Original POD</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(trip.actualPodAmt || trip.podBalance)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 mb-1">Remaining Balance</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(trip.podBalance)}
                  </p>
                </div>
              </div>
              
              {/* Submission Form */}
              <form onSubmit={handleSubmitActualPOD} className="space-y-4 mb-6">
                <div>
                  <label className="label">Submit POD Amount (₹)</label>
                  <input
                    type="number"
                    value={actualPodForm.actualPodAmt}
                    onChange={(e) => setActualPodForm({...actualPodForm, actualPodAmt: parseFloat(e.target.value) || 0})}
                    className="input"
                    placeholder="0"
                    required
                    max={trip.podBalance}
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum: {formatCurrency(trip.podBalance)}</p>
                </div>
                <div>
                  <label className="label">Payment Type</label>
                  <select 
                    className="input"
                    value={actualPodForm.paymentType}
                    onChange={(e) => setActualPodForm({...actualPodForm, paymentType: e.target.value})}
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="upi">📱 UPI</option>
                    <option value="cheque">📝 Cheque</option>
                    <option value="rtgs">🏦 RTGS</option>
                    <option value="neft">🏦 NEFT</option>
                    <option value="imps">📲 IMPS</option>
                  </select>
                </div>
                <div>
                  <label className="label">Optional notes</label>
                  <textarea
                    className="input"
                    rows="2"
                    placeholder="Add any notes..."
                    value={actualPodForm.notes}
                    onChange={(e) => setActualPodForm({...actualPodForm, notes: e.target.value})}
                  ></textarea>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowManagePODModal(false)}
                    className="flex-1 btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn bg-purple-600 text-white hover:bg-purple-700">
                    Submit POD
                  </button>
                </div>
              </form>
              
              {/* POD History */}
              {trip.podHistory && trip.podHistory.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    POD Submission History ({trip.podHistory.length})
                  </h4>
                  <div className="space-y-3">
                    {trip.podHistory.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                                Submission #{trip.podHistory.length - index}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.submittedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 capitalize">
                              Payment: {entry.paymentType?.replace('_', ' ')}
                            </p>
                            {entry.notes && (
                              <p className="text-xs text-gray-500 mt-1">
                                Note: {entry.notes}
                              </p>
                            )}
                            {entry.submittedBy && (
                              <p className="text-xs text-blue-600 mt-1">
                                By: {entry.submittedBy.fullName || entry.submittedBy.username}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex items-start space-x-2">
                            <div>
                              <p className="text-lg font-bold text-purple-600">
                                {formatCurrency(entry.submittedAmount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(entry.balanceBeforeSubmission)} → {formatCurrency(entry.balanceAfterSubmission)}
                              </p>
                            </div>
                            {entry.advanceId && (
                              <button
                                onClick={async () => {
                                  if (confirm('Delete this POD submission? This will also remove the associated advance.')) {
                                    try {
                                      await tripAdvanceAPI.delete(entry.advanceId);
                                      toast.success('POD submission deleted');
                                      loadTripDetails();
                                      loadAdvances();
                                    } catch (error) {
                                      toast.error('Failed to delete POD submission');
                                    }
                                  }
                                }}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-all duration-300"
                                title="Delete POD submission"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Total POD Submitted:</span>
                      <span className="text-xl font-bold text-purple-600">
                        {formatCurrency(trip.podHistory.reduce((sum, entry) => sum + entry.submittedAmount, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                Document Preview
              </h3>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewDocument.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDocument}
                  className="w-full h-full"
                  title="Document Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
                  <img
                    src={previewDocument}
                    alt="Document Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-between items-center">
              <a
                href={previewDocument}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
              <button
                onClick={closePreview}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
