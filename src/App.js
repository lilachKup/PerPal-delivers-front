import './App.css';
import DriverOrder from './components/delivers/DriverNearbyOrders.jsx';
import AuthTabs from './components/users/AuthTabs';
import ConfirmRegistration from './components/users/ConfirmRegistration.jsx';
import ForgotPassword from './components/users/ForgotPassword.jsx';
import CallbackPage from './CallbackPage';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

export default function App() {
  const auth = useAuth();
  const location = useLocation();

  const cached = (() => {
    try {
      return JSON.parse(localStorage.getItem('pp_user') || 'null');
    } catch {
      return null;
    }
  })();

  const profile = auth.user?.profile ?? {};

  const firstName =
    profile.given_name ||
    cached?.given_name ||
    (profile.name?.split(' ')[0]) ||
    (cached?.name?.split(' ')[0]) ||
    '';

  const lastName =
    profile.family_name ||
    cached?.family_name ||
    (profile.name?.split(' ').slice(1).join(' ')) ||
    (cached?.name?.split(' ').slice(1).join(' ')) ||
    '';

  console.log("profile:", profile);
  console.log("cached:", cached);
  console.log("firstName:", firstName, "lastName:", lastName);

  return (
    <Routes>
      <Route path="/" element={<AuthTabs />} />
      <Route path="/confirm" element={<ConfirmRegistration />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/callback" element={<CallbackPage />} />

      <Route
        path="/driverScreen"
        element={
          (auth.user?.profile !== null || cached !== null) ? (
            <DriverOrder
              driver_first_name={profile.given_name ?? cached?.given_name ?? ''}
              driver_last_name={profile.family_name ?? cached?.family_name ?? ''}
            />
          ) : (
            <Navigate to="/?tab=login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
