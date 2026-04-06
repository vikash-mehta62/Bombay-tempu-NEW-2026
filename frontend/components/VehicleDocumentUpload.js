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
      const doc = new jsPDF();
      let yPosition = 20;
      
      // Title
      doc.setFontSize(18);
      doc.text(`Vehicle Documents - ${vehicleData.vehicleNumber}`, 14, yPosition);
      yPosition += 10;
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, yPosition);
      yPosition += 15;

      // Add each document
      for (const docInfo of documents) {
        const docField = fieldMap[docInfo.type];
        if (vehicleData[docField]?.url) {
          // Add document title
          doc.setFontSize(14);
          doc.text(docInfo.label, 14, yPosition);
          yPosition += 7;
          
          // Add date if available
          if (docInfo.date) {
            doc.setFontSize(10);
            doc.text(`Date: ${new Date(docInfo.date).toLocaleDateString('en-IN')}`, 14, yPosition);
            yPosition += 7;
          }
          
          try {
            // Load image
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = vehicleData[docField].url;
            });
            
            // Calculate dimensions to fit page
            const maxWidth = 180;
            const maxHeight = 100;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
              height = (maxWidth / width) * height;
              width = maxWidth;
            }
            
            if (height > maxHeight) {
              width = (maxHeight / height) * width;
              height = maxHeight;
            }
            
            // Check if we need a new page
            if (yPosition + height > 270) {
              doc.addPage();
              yPosition = 20;
            }
            
            // Add image
            doc.addImage(img, 'JPEG', 14, yPosition, width, height);
            yPosition += height + 15;
          } catch (error) {
            console.error(`Failed to load image for ${docInfo.label}:`, error);
            doc.setFontSize(10);
            doc.text('(Image could not be loaded)', 14, yPosition);
            yPosition += 10;
          }
        }
      }
      
      // Save PDF
      doc.save(`${vehicleData.vehicleNumber}_documents_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('All documents downloaded as PDF');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-4">
      {/* Download All Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={downloadAllDocuments}
          className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download All Documents (PDF)</span>
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
