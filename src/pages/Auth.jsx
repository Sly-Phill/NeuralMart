import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, Sparkles, ShieldCheck, Heart, LibraryBig, ArrowRight } from 'lucide-react';
import { Page } from '../components/ui';
import { LogoMark } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Only allow returning to a path inside this site.
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/login') && !n.startsWith('/signup') ? n : '/library');

function Field({ icon: Icon, label, error, right, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className={`input pl-11 ${right ? 'pr-11' : ''} ${error ? '!border-rose-400/60' : ''}`} aria-invalid={!!error} {...props} />
        {right}
      </span>
      {error && <span className="mt-1.5 flex items-center gap-1 text-xs text-rose-400"><AlertCircle className="h-3.5 w-3.5" />{error}</span>}
    </label>
  );
}

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { user, ready, login, signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [f, setF] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => { document.title = `${isSignup ? 'Create account' : 'Log in'} · NeuralMart`; }, [isSignup]);
  useEffect(() => { setErrors({}); setFormError(''); }, [isSignup]);

  if (ready && user && !busy) return <Navigate to={next} replace />;

  const up = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); setFormError(''); };

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (isSignup && f.fullName.trim().length < 2) x.fullName = 'Please tell us your full name.';
    if (!/^\S+@\S+\.\S{2,}$/.test(f.email.trim())) x.email = 'That email doesn’t look quite right.';
    if (isSignup ? f.password.length < 8 : !f.password) x.password = isSignup ? 'Use at least 8 characters.' : 'Enter your password.';
    setErrors(x);
    if (Object.keys(x).length) return;
    setBusy(true);
    try {
      const u = isSignup ? await signup(f.fullName.trim(), f.email.trim(), f.password) : await login(f.email.trim(), f.password);
      toast(isSignup ? `Welcome to NeuralMart, ${u.fullName.split(' ')[0]}!` : `Welcome back, ${u.fullName.split(' ')[0]}!`, { description: isSignup ? 'Your account is ready.' : 'You’re logged in.' });
      navigate(next, { replace: true });
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  };

  const otherLink = `${isSignup ? '/login' : '/signup'}${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`;

  return (
    <Page>
      <div className="section grid items-center gap-10 lg:grid-cols-2">
        {/* pitch */}
        <div className="hidden lg:block">
          <p className="eyebrow mb-3">{isSignup ? 'Join NeuralMart' : 'Welcome back'}</p>
          <h1 className="text-5xl font-extrabold leading-tight">
            {isSignup ? <>Your AI stack, <span className="text-gradient">all in one place.</span></> : <>Pick up right <span className="text-gradient">where you left off.</span></>}
          </h1>
          <ul className="mt-8 space-y-4 text-muted">
            {[
              [Heart, 'Save apps to your wishlist on every device'],
              [LibraryBig, 'Launch everything you own from My Library'],
              [ShieldCheck, 'One secure account, one unified bill'],
            ].map(([I, t]) => (
              <li key={t} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15"><I className="h-5 w-5 text-violet-400" /></span>{t}</li>
            ))}
          </ul>
        </div>

        {/* form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-1 rounded-[2.2rem] bg-brand opacity-30 blur-2xl" />
          <form onSubmit={submit} noValidate className="card relative space-y-4 p-6 sm:p-8">
            <div className="mb-2 flex flex-col items-center text-center">
              <LogoMark className="h-12 w-12" />
              <h2 className="mt-4 text-2xl font-bold">{isSignup ? 'Create your account' : 'Log in to NeuralMart'}</h2>
              <p className="mt-1 text-sm text-muted">{params.get('next') ? 'You’ll go right back to where you were.' : isSignup ? 'Free forever. No card needed.' : 'Good to see you again.'}</p>
            </div>

            <AnimatePresence>
              {formError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-300" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /> <span className="text-ink">{formError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {isSignup && <Field icon={User} label="Full name" value={f.fullName} onChange={up('fullName')} placeholder="Ada Lovelace" autoComplete="name" error={errors.fullName} />}
            <Field icon={Mail} label="Email" type="email" value={f.email} onChange={up('email')} placeholder="you@company.com" autoComplete="email" error={errors.email} />
            <Field
              icon={Lock} label="Password" type={show ? 'text' : 'password'} value={f.password} onChange={up('password')}
              placeholder={isSignup ? 'At least 8 characters' : 'Your password'} autoComplete={isSignup ? 'new-password' : 'current-password'} error={errors.password}
              right={<button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
            />

            <button disabled={busy} className="btn-primary w-full !py-3.5 text-base shimmer-overlay">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {isSignup ? 'Creating account…' : 'Logging in…'}</> : <>{isSignup ? <Sparkles className="h-4 w-4" /> : null}{isSignup ? 'Create account' : 'Log in'} <ArrowRight className="h-4 w-4" /></>}
            </button>

            <p className="text-center text-sm text-muted">
              {isSignup ? 'Already have an account?' : 'New to NeuralMart?'}{' '}
              <Link to={otherLink} replace className="font-semibold text-violet-500 hover:underline dark:text-violet-400">{isSignup ? 'Log in' : 'Create a free account'}</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </Page>
  );
}
