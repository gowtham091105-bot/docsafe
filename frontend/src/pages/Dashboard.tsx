import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { FileText, Clock, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiClient.get('/docsafe/dashboard/summary');
        setSummary(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const stats = [
    { label: 'Total Documents', value: summary?.totalDocuments || 0, icon: FileText, color: 'bg-blue-500' },
    { label: 'Active', value: summary?.activeDocuments || 0, icon: FileText, color: 'bg-green-500' },
    { label: 'Expiring Soon', value: summary?.expiringSoon || 0, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Expired', value: summary?.expired || 0, icon: XCircle, color: 'bg-red-500' },
    { label: 'Missing Compliance', value: summary?.missingCompliance || 0, icon: AlertTriangle, color: 'bg-orange-500' },
    { label: 'Renewal in Progress', value: summary?.renewalsInProgress || 0, icon: RefreshCw, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
            <div className={`${stat.color} p-4 rounded-lg text-white mr-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {summary?.recentActivity?.length > 0 ? (
              summary.recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="mt-1 mr-3 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-800">{activity.eventType}</p>
                    <p className="text-xs text-gray-500">{format(new Date(activity.triggeredAt), 'PPp')}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent activity.</p>
            )}
          </div>
        </div>

        {/* Quick Lists */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Expiring Soon</h2>
              <Link to="/expiring-soon" className="text-sm text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {summary?.quickLists?.expiringSoon?.length > 0 ? (
                summary.quickLists.expiringSoon.map((doc: any) => (
                  <div key={doc.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="truncate pr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                      <p className="text-xs text-red-500">Expires: {format(new Date(doc.expiryDate), 'PP')}</p>
                    </div>
                    <Link to={`/documents/${doc.id}`} className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">
                      View
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No documents expiring soon.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Missing Compliance</h2>
              <Link to="/compliance" className="text-sm text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {summary?.quickLists?.missingCompliance?.length > 0 ? (
                summary.quickLists.missingCompliance.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="truncate pr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-red-500">Severity: {item.severity}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No missing compliance items.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
