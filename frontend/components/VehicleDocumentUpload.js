'use client';

import { useState } from 'react';
import { Upload, X, FileText, Trash2, Eye, Download } from 'lucide-react';
import { vehicleAPI } from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function VehicleDocumentUpload({ vehicle, onUpdate, isAdminView = true }) {
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [vehicleData, setVehicleData] = useState(vehicle);

  // Map document types to actual model field names
  const fieldMap = {
    'registration': 'registrationDocument',
    'registrationFront': 'registrationDocumentFront',
    'registrationBack': 'registrationDocumentBack',
    'fitness': 'fitnessDocument',
    'insurance': 'insuranceDocument',
    'puc': 'pucDocument',
    'permit': 'permitDocument',
    'nationalPermit': 'nationalPermitDocument',
    'tax': 'taxDocument',
    'aadharFront': 'aadharCardFront',
    'aadharBack': 'aadharCardBack',
    'pan': 'panCard',
    'tds': 'tdsForm'
  };

  const documents = [
    { type: 'registration', label: 'Registration Certificate', date: vehicleData.registrationDate },
    // { type: 'registrationFront', label: 'Registration Certificate Front', date: vehicleData.registrationDate },
    // { type: 'registrationBack', label: 'Registration Certificate Back', date: vehicleData.registrationDate },
    { type: 'fitness', label: 'Fitness Certificate', date: vehicleData.fitnessExpiryDate },
    { type: 'insurance', label: 'Insurance', date: vehicleData.insuranceExpiryDate },
    { type: 'puc', label: 'PUC Certificate', date: vehicleData.pucExpiryDate },
    { type: 'permit', label: 'Permit', date: vehicleData.permitExpiryDate },
    { type: 'nationalPermit', label: 'National Permit', date: vehicleData.nationalPermitExpiryDate },
    { type: 'tax', label: 'Tax Receipt', date: vehicleData.taxValidUptoDate },
    { type: 'aadharFront', label: 'Aadhar Card Front', date: null },
    { type: 'aadharBack', label: 'Aadhar Card Back', date: null },
    { type: 'pan', label: 'PAN Card', date: null },
    { type: 'tds', label: 'TDS Form', date: null }
  ];

  const reloadVehicleData = async () => {
    try {
      const response = await vehicleAPI.getById(vehicle._id);
      setVehicleData(response.data.data);
    } catch (error) {
      console.error('Error reloading vehicle:', error);
    }
  };

  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      await vehicleAPI.uploadDocument(vehicle._id, formData);
      
      const doc = documents.find(d => d.type === documentType);
      toast.success(`${doc.label} uploaded successfully`);
      
      // Reload vehicle data to show updated document
      await reloadVehicleData();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (documentType) => {
    const doc = documents.find(d => d.type === documentType);
    
    if (!confirm(`Are you sure you want to delete ${doc.label}?`)) {
      return;
    }

    try {
      await vehicleAPI.deleteDocument(vehicle._id, documentType);
      toast.success(`${doc.label} deleted successfully`);
      
      // Reload vehicle data to show updated state
      await reloadVehicleData();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const viewImage = (url, title) => {
    setSelectedImage({ url, title });
    setShowImageModal(true);
  };

  const downloadAllDocuments = async () => {
    try {
      toast.loading('Generating PDF from server...');
      
      const response = await vehicleAPI.downloadDocumentsPDF(vehicle._id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${vehicleData.vehicleNumber}_documents_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('All documents downloaded as PDF');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.dismiss();
      toast.error('Failed to download PDF');
    }
  };

  const downloadAllDocumentsZIP = async () => {
    try {
      toast.loading('Creating ZIP file from server...');
      
      const response = await vehicleAPI.downloadDocumentsZIP(vehicle._id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/zip' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${vehicleData.vehicleNumber}_Documents_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('All documents downloaded as ZIP');
    } catch (error) {
      console.error('ZIP download error:', error);
      toast.dismiss();
      toast.error('Failed to download ZIP');
    }
  };

  return (
    <div className="space-y-4">
      {/* Download All Buttons */}
      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={downloadAllDocumentsZIP}
          className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download All (ZIP)</span>
        </button>
        <button
          onClick={downloadAllDocuments}
          className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download All (PDF)</span>
        </button>
      </div>

      {/* Document List */}
      {documents.map((docInfo) => {
        const docField = fieldMap[docInfo.type];
        const hasDocument = vehicleData[docField]?.url;
        
        return (
          <div key={docInfo.type} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">{docInfo.label}</h4>
                  {docInfo.date && (
                    <p className="text-xs text-gray-500">
                      Date: {new Date(docInfo.date).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
              {hasDocument && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => viewImage(vehicleData[docField].url, docInfo.label)}
                    className="btn btn-sm btn-secondary flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  {isAdminView && (
                    <button
                      onClick={() => handleDeleteDocument(docInfo.type)}
                      className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {hasDocument ? (
              <div className="bg-gray-50 p-3 rounded">
                <img 
                  src={vehicleData[docField].url} 
                  alt={docInfo.label} 
                  className="w-full h-40 object-contain rounded cursor-pointer"
                  onClick={() => viewImage(vehicleData[docField].url, docInfo.label)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Uploaded: {new Date(vehicleData[docField].uploadedAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">No document uploaded</p>
                {isAdminView && (
                  <label className="btn btn-sm btn-primary cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {docInfo.label}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, docInfo.type)}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Image Preview Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedImage.title}</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <img 
              src={selectedImage.url} 
              alt={selectedImage.title}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-900 mt-4">Uploading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
