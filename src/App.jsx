import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Background from './components/Background';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import AppDetail from './pages/AppDetail';
import Compare from './pages/Compare';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Library from './pages/Library';
import Seller from './pages/Seller';
import NotFound from './pages/NotFound';
import AuthPage from './pages/Auth';
import RequireAuth from './components/RequireAuth';

const TITLES = {
  '/': 'NeuralMart — The AI App Marketplace',
  '/explore': 'Explore AI Apps · NeuralMart',
  '/compare': 'Compare AI Apps · NeuralMart',
  '/pricing': 'Pricing & Bundles · NeuralMart',
  '/checkout': 'Checkout · NeuralMart',
  '/success': 'Your apps are ready · NeuralMart',
  '/library': 'My Library · NeuralMart',
  '/sell': 'Sell on NeuralMart',
};

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  useEffect(() => {
    if (TITLES[pathname]) document.title = TITLES[pathname];
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <Background />
      <ScrollManager />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Marketplace />} />
          <Route path="/app/:id" element={<AppDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/success" element={<Success />} />
          <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/sell" element={<Seller />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <Footer />
      <CartDrawer />
      <BottomNav />
    </>
  );
}
