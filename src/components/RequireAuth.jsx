import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Page, Skeleton } from './ui';

/** Pages that need an account (checkout, My Library) send visitors to log in first, then back. */
export default function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) {
    return (
      <Page>
        <div className="section space-y-4" role="status" aria-label="Checking your session">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-32 !rounded-3xl" />)}</div>
        </div>
      </Page>
    );
  }
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search + loc.hash)}`} replace />;
  return children;
}
