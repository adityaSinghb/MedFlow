import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthProvider';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash || '';
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const sessionId = params.get('session_id');
    if (!sessionId) { navigate('/login', { replace: true }); return; }

    (async () => {
      try {
        const r = await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
        setUser(r.data.user);
        // Clean the hash and redirect to dashboard
        window.history.replaceState(null, '', '/dashboard');
        navigate('/dashboard', { replace: true, state: { user: r.data.user } });
      } catch (e) {
        console.error('Auth exchange failed', e);
        navigate('/login', { replace: true });
      }
    })();
  }, [location.hash, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="font-mono text-sm text-muted-foreground">Establishing secure session…</div>
    </div>
  );
}
