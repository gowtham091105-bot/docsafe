import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import type { Category, User } from '../types';

const DocumentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    ownerUserId: '',
    issueDate: '',
    expiryDate: '',
    renewalDueDate: '',
    description: '',
  });
  
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [catsRes, usersRes] = await Promise.all([
          apiClient.get('/docsafe/categories'),
          apiClient.get('/auth/users') // assuming this exists or similar
        ]);
        setCategories(catsRes.data.data.filter((c: Category) => c.isActive));
        setOwners(usersRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch reference data");
      }
    };
    
    fetchFormData();

    if (isEdit) {
      const fetchDoc = async () => {
        try {
          const res = await apiClient.get(`/docsafe/documents/${id}`);
          const doc = res.data.data;
          setFormData({
            title: doc.title,
            categoryId: doc.categoryId,
            ownerUserId: doc.ownerUserId || '',
            issueDate: doc.issueDate.split('T')[0],
            expiryDate: doc.expiryDate.split('T')[0],
            renewalDueDate: doc.renewalDueDate ? doc.renewalDueDate.split('T')[0] : '',
            description: doc.description || '',
          });
        } catch (err) {
          console.error(err);
        }
      };
      fetchDoc();
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isEdit && !file) {
      setError('File is required when creating a document');
      return;
    }
    
    if (formData.expiryDate < formData.issueDate) {
      setError('Expiry date must be greater than or equal to issue date');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        renewalDueDate: formData.renewalDueDate || undefined,
        ownerUserId: formData.ownerUserId || undefined,
      };

      let docId = id;

      if (isEdit) {
        await apiClient.put(`/docsafe/documents/${docId}`, payload);
      } else {
        const res = await apiClient.post('/docsafe/documents', payload);
        docId = res.data.data.id;
      }

      if (file && docId) {
        const formData = new FormData();
        formData.append('file', file);
        await apiClient.post(`/docsafe/documents/${docId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      navigate(`/documents/${docId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Document' : 'Add Document'}</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
              <select
                name="categoryId"
                required
                value={formData.categoryId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
              >
                <option value="">Select a category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Owner</label>
              <select
                name="ownerUserId"
                value={formData.ownerUserId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
              >
                <option value="">Select owner</option>
                {owners.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="issueDate"
                required
                value={formData.issueDate}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expiry Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="expiryDate"
                required
                value={formData.expiryDate}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Renewal Due Date</label>
              <input
                type="date"
                name="renewalDueDate"
                value={formData.renewalDueDate}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="md:col-span-2 border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">File Upload {!isEdit && <span className="text-red-500">*</span>}</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-xs text-gray-500">Supported: PDF, PNG, JPG. Max size: 10MB.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-blue-400"
            >
              {loading ? 'Saving...' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentForm;
