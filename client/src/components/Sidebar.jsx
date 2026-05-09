import { FilePlus, Files, LayoutDashboard, LogOut, PieChart, Settings, Users } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices', label: 'Invoices', icon: Files },
  { to: '/invoices/create', label: 'New Invoice', icon: FilePlus },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/reports', label: 'Reports', icon: PieChart },
  { to: '/profile', label: 'Profile', icon: Settings },
];

// Sidebar provides the fixed navigation menu for all protected pages.
export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-64 bg-gray-900 px-4 py-6 text-white">
      <div className="mb-8 px-3">
        <h2 className="text-xl font-bold">Invoice System</h2>
        <p className="mt-1 text-sm text-gray-300">Freelancers and SMEs</p>
      </div>
      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-gray-200 hover:bg-gray-800"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>
    </aside>
  );
}
