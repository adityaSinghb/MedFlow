import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useSimulationStore } from '../../store/useSimulationStore';
import { DISPATCH } from '../../constants/testIds/medflow';

const TONE = {
  info: 'text-blue-300',
  success: 'text-green-400',
  warn: 'text-orange-300',
  muted: 'text-slate-400',
};

export default function DispatchFeed() {
  const logs = useSimulationStore(s => s.dispatchLogs);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <Card className="tactical-card h-full flex flex-col">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Live Dispatch Feed</CardTitle>
        <Badge className="bg-available border text-xs font-mono">
          <span className="live-dot inline-block h-2 w-2 rounded-full mr-2 align-middle" />
          <span className="status-available align-middle">STREAM LIVE</span>
        </Badge>
      </CardHeader>
      <CardContent className="flex-1">
        <div
          ref={ref}
          data-testid={DISPATCH.feed}
          className="terminal-scroll h-[420px] overflow-y-auto rounded-md bg-black/70 border border-border p-3 font-mono text-xs leading-6"
        >
          {logs.length === 0 && (
            <div className="text-slate-500">[--:--:--] Waiting for incoming trauma cases...</div>
          )}
          {logs.map(l => (
            <div key={l.id} className={TONE[l.tone] || 'text-slate-300'}>
              <span className="text-slate-500">[{l.ts}]</span> {l.msg}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
