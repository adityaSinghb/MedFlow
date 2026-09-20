import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { useSimulationStore } from '../../store/useSimulationStore';
import { DISPATCH } from '../../constants/testIds/medflow';
import { formatDistanceToNowStrict } from 'date-fns';
import { Clock, MapPin, Building2 } from 'lucide-react';

const SEV = {
  Critical: 'status-critical bg-critical',
  Severe:   'status-severe bg-severe',
  Moderate: 'status-moderate bg-moderate',
};

function TimeAgo({ iso }) {
  const [_, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(t => t+1), 1000); return () => clearInterval(id); }, []);
  return <span>{formatDistanceToNowStrict(new Date(iso), { addSuffix: false })} ago</span>;
}

function medicalSummary(patients, patientId) {
  if (!patientId) return null;
  const p = patients.find(x => x.id === patientId);
  if (!p) return null;
  const active = p.medications.filter(m => m.status === 'active').length;
  return { active, conditions: p.medicalConditions.length, alerts: p.alerts.length, name: p.name };
}

export default function QueueDispatchPanel() {
  const queue = useSimulationStore(s => s.holdingQueue);
  const dispatches = useSimulationStore(s => s.recentDispatches);
  const patients = useSimulationStore(s => s.patients);

  const sorted = [...queue].sort((a,b) => {
    const rank = { Critical: 3, Severe: 2, Moderate: 1 };
    const s = rank[b.severity] - rank[a.severity];
    if (s !== 0) return s;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return (
    <div className="space-y-4">
      <Card className="tactical-card">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Holding Queue</CardTitle>
          <Badge variant="outline" className="font-mono">{queue.length} waiting</Badge>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div className="text-xs text-muted-foreground font-mono py-6 text-center">No queued cases — network capacity nominal.</div>
          ) : (
            <ScrollArea className="max-h-[220px] pr-2">
              <ul className="space-y-2">
                {sorted.map((c, idx) => (
                  <li key={c.id} data-testid={DISPATCH.queueItem(c.id)} className={`rounded-md border px-3 py-2 ${SEV[c.severity]}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">#{idx + 1}</span> · {c.id}
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest2 ${SEV[c.severity].split(' ')[0]}`}>{c.severity}</span>
                    </div>
                    <div className="text-xs mt-1 opacity-80 line-clamp-2">{c.description}</div>
                    <div className="text-[11px] font-mono mt-1 flex items-center gap-3 text-muted-foreground">
                      <span>{c.requiredSpecialist}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> <TimeAgo iso={c.createdAt} /></span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location.latitude.toFixed(2)}, {c.location.longitude.toFixed(2)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="tactical-card">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Recent Dispatches</CardTitle>
          <Badge variant="outline" className="font-mono">{dispatches.length}</Badge>
        </CardHeader>
        <CardContent>
          {dispatches.length === 0 ? (
            <div className="text-xs text-muted-foreground font-mono py-6 text-center">No dispatches yet.</div>
          ) : (
            <ScrollArea className="max-h-[260px] pr-2">
              <ul className="space-y-2">
                {dispatches.map(d => {
                  const ms = medicalSummary(patients, d.patientId);
                  return (
                    <li key={d.id} data-testid={DISPATCH.recentItem(d.id)} className="rounded-md border border-border px-3 py-2 bg-secondary/40">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-xs">{d.id}</div>
                        <span className={`text-[10px] uppercase tracking-widest2 ${SEV[d.severity]?.split(' ')[0]}`}>{d.severity}</span>
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="text-foreground">{d.assignedHospitalName}</span>
                        <span>·</span>
                        <span>{d.requiredSpecialist}</span>
                        <span>·</span>
                        <span>{typeof d.distance === 'number' ? d.distance.toFixed(1) + ' km' : '—'}</span>
                      </div>
                      {ms && (
                        <div className="text-[11px] font-mono mt-1 text-muted-foreground">
                          {ms.name} · {ms.active} active med · {ms.conditions} cond. · {ms.alerts} alert
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
