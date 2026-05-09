import { Navigate } from 'react-router-dom';

// ProtectedRoute prevents unauthenticated users from seeing private pages.
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

