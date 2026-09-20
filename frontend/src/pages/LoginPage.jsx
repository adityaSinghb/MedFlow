import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Radar, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const handleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-md bg-red-600/15 border border-red-500/40 flex items-center justify-center">
            <Radar className="h-5 w-5 status-critical" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">MedFlow</div>
            <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground">Trauma Resource Network</div>
          </div>
        </div>

        <Card className="tactical-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Command Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in to enter the dispatcher console. All hospitals, patients, alerts and dispatch decisions in
              MedFlow are synthetic and for simulation only.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground">
              <div className="rounded-md border border-border p-2 flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 status-available" /> Secure OAuth</div>
              <div className="rounded-md border border-border p-2 flex items-center gap-2"><Zap className="h-3.5 w-3.5 status-info" /> 7-day session</div>
            </div>

            <Button
              onClick={handleSignIn}
              data-testid="btn-sign-in-google"
              className="w-full bg-white text-slate-900 hover:bg-slate-100 font-semibold h-11"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" className="mr-2" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Sign in with Google
            </Button>

            <p className="text-[11px] text-muted-foreground text-center">
              By continuing you agree that MedFlow is a simulation demo and not a clinical decision system.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
