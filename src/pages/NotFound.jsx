import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { Page, EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <Page>
      <div className="section py-10">
        <p className="mb-6 text-center font-display text-8xl font-extrabold text-gradient">404</p>
        <EmptyState icon={Bot} title="Even our AI couldn't find this page" text="The link may be broken or the page may have moved. Let's get you back on track.">
          <Link to="/" className="btn-primary">Go home</Link>
          <Link to="/explore" className="btn-ghost">Explore apps</Link>
        </EmptyState>
      </div>
    </Page>
  );
}
