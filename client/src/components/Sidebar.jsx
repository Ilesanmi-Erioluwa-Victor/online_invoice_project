import {
  FilePlus,
  Files,
  LayoutDashboard,
  LogOut,
  PieChart,
  Settings,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices", label: "Invoices", icon: Files },
  { to: "/invoices/create", label: "New Invoice", icon: FilePlus },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/reports", label: "Reports", icon: PieChart },
  { to: "/profile", label: "Profile", icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 bg-gray-900 px-4 py-6 text-white lg:block">
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
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-200 hover:bg-gray-800"
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

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-7 border-t border-gray-200 bg-white px-1 py-2 shadow-lg lg:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] font-medium ${
                  isActive ? "text-indigo-600" : "text-gray-600"
                }`
              }
            >
              <Icon size={18} />
              <span className="w-full truncate text-center">{link.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] font-medium text-gray-600"
        >
          <LogOut size={18} />
          <span className="w-full truncate text-center">Logout</span>
        </button>
      </nav>
    </>
  );
}
