import { Navigate } from 'react-router-dom';
import { useAppSelector } from 'src/app/hooks';
import { getLoggedInUser } from 'src/features/auth/authSlice';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const user = useAppSelector(getLoggedInUser);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user.is_admin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};