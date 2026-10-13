import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  AlertTriangle, 
  Clock, 
  XCircle,
  Tags,
  LogOut,
  Menu
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Compliance', path: '/compliance', icon: AlertTriangle },
    { name: 'Expiring Soon', path: '/expiring-soon', icon: Clock },
    { name: 'Expired', path: '/expired', icon: XCircle },
  ];

  // Only show categories to admins
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') {
    navItems.push({ name: 'Categories', path: '/categories', icon: Tags });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>Docsafe</h1>
          {!sidebarOpen && <FileText className="w-8 h-8" />}
        </div>
        
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 min-w-[20px]" />
                    <span className={`ml-3 whitespace-nowrap ${!sidebarOpen && 'hidden'}`}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className={`ml-3 ${!sidebarOpen && 'hidden'}`}>
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className={`mt-4 flex items-center text-slate-400 hover:text-white w-full ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5" />
            <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white h-16 border-b flex items-center px-4 justify-between shrink-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 hidden md:block"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="md:hidden font-bold text-lg">Docsafe</div>
          
          <div className="flex items-center">
             {/* Add notifications/search here if needed */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
