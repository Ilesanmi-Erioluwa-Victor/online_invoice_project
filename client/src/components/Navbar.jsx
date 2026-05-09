import { useAuth } from '../context/AuthContext';

// Navbar shows the current business name and logged-in user's email on protected pages.
export default function Navbar() {
  const { user } = useAuth();
  const businessName = user?.business_name || user?.full_name || 'Online Invoicing System';

  return (
    <header className="fixed left-64 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
      <div>
        <p className="text-sm text-gray-500">Business</p>
        <h1 className="text-lg font-semibold text-gray-900">{businessName}</h1>
      </div>
      <p className="text-sm text-gray-600">{user?.email}</p>
    </header>
  );
}

