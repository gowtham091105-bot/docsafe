import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { format } from 'date-fns';
import { Download, File, ArrowLeft, RefreshCw, Edit } from 'lucide-react';
import type { Document } from '../types';

const DocumentDetail = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState<Document | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const [docRes, histRes] = await Promise.all([
          apiClient.get(`/docsafe/documents/${id}`),
          apiClient.get(`/docsafe/documents/${id}/history`).catch(() => ({ data: { data: [] } }))
        ]);
        setDoc(docRes.data.data);
        setHistory(histRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleDownload = async () => {
    try {
      const response = await apiClient.get(`/docsafe/documents/${id}/file`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc?.title || 'document');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to download file');
    }
  };

  const handleStartRenewal = async () => {
    try {
      if (confirm('Are you sure you want to start a renewal process?')) {
        await apiClient.post(`/docsafe/documents/${id}/renewal`, { remarks: 'Manual renewal initiated' });
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to start renewal');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!doc) return <div>Document not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/documents" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold status-${doc.status.toLowerCase().replace('_', '-')}`}>
            {doc.status}
          </span>
        </div>
        <div className="flex gap-2">
          <Link to={`/documents/${doc.id}/edit`} className="flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Metadata */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Document Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{doc.category?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p className="font-medium">{doc.owner?.firstName} {doc.owner?.lastName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issue Date</p>
                <p className="font-medium">{format(new Date(doc.issueDate), 'PP')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="font-medium">{format(new Date(doc.expiryDate), 'PP')}</p>
              </div>
              {doc.renewalDueDate && (
                <div>
                  <p className="text-sm text-gray-500">Renewal Due Date</p>
                  <p className="font-medium">{format(new Date(doc.renewalDueDate), 'PP')}</p>
                </div>
              )}
              {doc.description && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{doc.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* File Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">File Information</h2>
            {doc.fileAssetId ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <File className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Document File</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDownload} className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 font-medium">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No file attached.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Renewal Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Renewal</h2>
            <button 
              onClick={handleStartRenewal}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Renewal
            </button>
          </div>

          {/* Activity History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Activity History</h2>
            <div className="space-y-4">
              {history.length > 0 ? history.map((event) => (
                <div key={event.id} className="relative pl-4 border-l-2 border-gray-200">
                  <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] top-1.5"></div>
                  <p className="text-sm font-medium text-gray-900">{event.eventType}</p>
                  <p className="text-xs text-gray-500">{format(new Date(event.triggeredAt), 'PPp')}</p>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No activity recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
