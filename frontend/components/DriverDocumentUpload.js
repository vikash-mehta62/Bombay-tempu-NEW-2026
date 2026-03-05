'use client';

import { useState } from 'react';
import { Upload, X, FileText, Trash2, Eye } from 'lucide-react';
import { driverAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function DriverDocumentUpload({ driver, onUpdate, isAdminView = true }) {
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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

      await driverAPI.uploadDocument(driver._id, formData);
      
      const docName = documentType === 'license' ? 'License' : 
                      documentType === 'aadhaar-front' ? 'Aadhaar Front' : 
                      'Aadhaar Back';
      toast.success(`${docName} uploaded successfully`);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteDocument = async (documentType) => {
    const docName = documentType === 'license' ? 'License' : 
                    documentType === 'aadhaar-front' ? 'Aadhaar Front' : 
                    'Aadhaar Back';
    
    if (!confirm(`Are you sure you want to delete this ${docName} document?`)) {
      return;
    }

    try {
      await driverAPI.deleteDocument(driver._id, documentType);
      toast.success(`${docName} deleted successfully`);
      
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

  return (
    <div className="space-y-4">
      {/* License Document */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">License Document</h4>
          </div>
          {driver.licenseDocument?.url && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => viewImage(driver.licenseDocument.url, 'License Document')}
                className="btn btn-sm btn-secondary flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              {isAdminView && (
                <button
                  onClick={() => handleDeleteDocument('license')}
                  className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {driver.licenseDocument?.url ? (
          <div className="bg-gray-50 p-3 rounded">
            <img 
              src={driver.licenseDocument.url} 
              alt="License" 
              className="w-full h-40 object-contain rounded cursor-pointer"
              onClick={() => viewImage(driver.licenseDocument.url, 'License Document')}
            />
            <p className="text-xs text-gray-500 mt-2">
              Uploaded: {new Date(driver.licenseDocument.uploadedAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">No license document uploaded</p>
            {isAdminView && (
              <label className="btn btn-sm btn-primary cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload License
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'license')}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Aadhaar Front Document */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Aadhaar Front</h4>
          </div>
          {driver.aadhaarFrontDocument?.url && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => viewImage(driver.aadhaarFrontDocument.url, 'Aadhaar Front')}
                className="btn btn-sm btn-secondary flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              {isAdminView && (
                <button
                  onClick={() => handleDeleteDocument('aadhaar-front')}
                  className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {driver.aadhaarFrontDocument?.url ? (
          <div className="bg-gray-50 p-3 rounded">
            <img 
              src={driver.aadhaarFrontDocument.url} 
              alt="Aadhaar Front" 
              className="w-full h-40 object-contain rounded cursor-pointer"
              onClick={() => viewImage(driver.aadhaarFrontDocument.url, 'Aadhaar Front')}
            />
            <p className="text-xs text-gray-500 mt-2">
              Uploaded: {new Date(driver.aadhaarFrontDocument.uploadedAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">No aadhaar front uploaded</p>
            {isAdminView && (
              <label className="btn btn-sm btn-primary cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload Aadhaar Front
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'aadhaar-front')}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Aadhaar Back Document (Optional) */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Aadhaar Back <span className="text-xs text-gray-500">(Optional)</span></h4>
          </div>
          {driver.aadhaarBackDocument?.url && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => viewImage(driver.aadhaarBackDocument.url, 'Aadhaar Back')}
                className="btn btn-sm btn-secondary flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              {isAdminView && (
                <button
                  onClick={() => handleDeleteDocument('aadhaar-back')}
                  className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {driver.aadhaarBackDocument?.url ? (
          <div className="bg-gray-50 p-3 rounded">
            <img 
              src={driver.aadhaarBackDocument.url} 
              alt="Aadhaar Back" 
              className="w-full h-40 object-contain rounded cursor-pointer"
              onClick={() => viewImage(driver.aadhaarBackDocument.url, 'Aadhaar Back')}
            />
            <p className="text-xs text-gray-500 mt-2">
              Uploaded: {new Date(driver.aadhaarBackDocument.uploadedAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">No aadhaar back uploaded</p>
            {isAdminView && (
              <label className="btn btn-sm btn-primary cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload Aadhaar Back
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'aadhaar-back')}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        )}
      </div>

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
