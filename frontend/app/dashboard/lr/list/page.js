'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function LRListPage() {
  const router = useRouter();
  const [lrs, setLrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'X-Company': localStorage.getItem('selectedCompany') || 'buts'
  });

  useEffect(() => {
    loadLRs();
  }, []);

  const loadLRs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lrs`, {
        headers: authHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setLrs(data);
      } else {
        toast.error('Failed to load LRs');
      }
    } catch (error) {
      console.error('Load LRs error:', error);
      toast.error('Error loading LRs');
    } finally {
      setLoading(false);
    }
  };

  const deleteLR = async (id) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lrs/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (response.ok) {
        toast.success('LR deleted successfully');
        loadLRs();
      } else {
        toast.error('Failed to delete LR');
      }
    } catch (error) {
      console.error('Delete LR error:', error);
      toast.error('Error deleting LR');
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">LR Records</h1>
        <button
          onClick={() => router.push('/dashboard/lr')}
          className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} /> Create New LR
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : lrs.length === 0 ? (
        <div className="text-center py-10 bg-white rounded shadow">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No LR records found</p>
          <button
            onClick={() => router.push('/dashboard/lr')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create First LR
          </button>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold">Consignment No</th>
                <th className="px-4 py-3 text-left text-sm font-bold">From</th>
                <th className="px-4 py-3 text-left text-sm font-bold">To</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Consignor</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Consignee</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                <th className="px-4 py-3 text-center text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lrs.map((lr) => (
                <tr key={lr._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-bold text-blue-600">
                    <div className="flex items-center gap-2">
                      <span>{lr.consignmentNo}</span>
                      {lr.invoiceDocument?.url && (
                        <a
                          href={lr.invoiceDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 flex items-center justify-center p-0.5 hover:bg-green-50 rounded"
                          title="View Invoice"
                        >
                          <FileText size={15} />
                        </a>
                      )}
                      {lr.billDocument?.url && (
                        <a
                          href={lr.billDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-500 hover:text-orange-700 flex items-center justify-center p-0.5 hover:bg-orange-50 rounded"
                          title="View Bill"
                        >
                          <FileText size={15} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{lr.from || '-'}</td>
                  <td className="px-4 py-3 text-sm">{lr.to || '-'}</td>
                  <td className="px-4 py-3 text-sm">{lr.consignorName || '-'}</td>
                  <td className="px-4 py-3 text-sm">{lr.consigneeName || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(lr.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/lr?id=${lr._id}`)}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(lr._id)}
                        className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this LR? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteLR(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
