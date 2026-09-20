import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { AlertTriangle, Pill, Plus, RotateCcw, StopCircle, Pencil, User } from 'lucide-react';
import { toast } from 'sonner';
import { useSimulationStore } from '../../store/useSimulationStore';
import { PATIENT } from '../../constants/testIds/medflow';
import { format } from 'date-fns';

const ALERT_TONE = {
  'Blood Thinners': 'bg-critical status-critical',
  'Anticoagulant': 'bg-critical status-critical',
  'Cardiac History': 'bg-severe status-severe',
  'Diabetes': 'bg-moderate status-moderate',
  'Hypertension': 'bg-info status-info',
  'Allergy': 'bg-locked status-locked',
};

function AddMedDialog({ patientId }) {
  const addMed = useSimulationStore(s => s.addMedication);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', condition: '', dosage: '', frequency: '', prescribingDoctor: '', startDate: new Date().toISOString().slice(0,10) });

  const submit = () => {
    if (!form.name.trim()) return toast.error('Medication name required');
    try {
      addMed(patientId, form);
      toast.success(`${form.name} added to ledger`);
      setForm({ name: '', condition: '', dosage: '', frequency: '', prescribingDoctor: '', startDate: new Date().toISOString().slice(0,10) });
      setOpen(false);
    } catch (e) {
      toast.error(e.message || 'Failed to add medication');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={PATIENT.addMed}><Plus className="h-4 w-4 mr-1" /> Add Medication</Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <DialogHeader><DialogTitle>Add Medication</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><Label className="text-xs">Condition</Label><Input value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} /></div>
          <div><Label className="text-xs">Dosage</Label><Input value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} /></div>
          <div><Label className="text-xs">Frequency</Label><Input value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} /></div>
          <div><Label className="text-xs">Prescribing Doctor</Label><Input value={form.prescribingDoctor} onChange={e => setForm({...form, prescribingDoctor: e.target.value})} /></div>
          <div><Label className="text-xs">Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
        </div>
        <DialogFooter><Button onClick={submit}>Add</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PatientPortal() {
  const patients = useSimulationStore(s => s.patients);
  const discontinue = useSimulationStore(s => s.discontinueMedication);
  const reactivate = useSimulationStore(s => s.reactivateMedication);
  const getInteractions = useSimulationStore(s => s.getInteractions);
  const [selectedId, setSelectedId] = useState(patients[0]?.id);
  const patient = patients.find(p => p.id === selectedId) || patients[0];
  const interactions = useMemo(() => patient ? getInteractions(patient) : [], [patient, getInteractions]);

  if (!patient) return <div className="text-muted-foreground text-sm">No patients.</div>;

  const active = patient.medications.filter(m => m.status === 'active');
  const discontinued = patient.medications.filter(m => m.status === 'discontinued');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <Card className="tactical-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px]">
            <ul className="space-y-1">
              {patients.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left px-3 py-2 rounded-md border ${selectedId === p.id ? 'border-blue-400 bg-info' : 'border-border hover:border-blue-500/40'}`}
                  >
                    <div className="text-sm">{p.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{p.id} · {p.medications.filter(m => m.status==='active').length} active meds</div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="tactical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 status-info" /> {patient.name}</CardTitle>
                <div className="text-[11px] font-mono text-muted-foreground mt-1">{patient.id} · Last updated {format(new Date(patient.updatedAt), 'PP p')}</div>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">SIMULATED</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground mb-1">Medical Conditions</div>
              <div className="flex flex-wrap gap-1">
                {patient.medicalConditions.length === 0
                  ? <span className="text-xs text-muted-foreground">None reported</span>
                  : patient.medicalConditions.map((c,i) => <Badge key={i} variant="secondary">{c}</Badge>)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground mb-1">Medical Alerts</div>
              <div className="flex flex-wrap gap-1">
                {patient.alerts.length === 0
                  ? <span className="text-xs text-muted-foreground">No alerts</span>
                  : patient.alerts.map((a,i) => <Badge key={i} className={`border ${ALERT_TONE[a] || 'bg-info status-info'}`}>{a}</Badge>)}
              </div>
            </div>
            {interactions.length > 0 && (
              <div className="rounded-md border bg-critical p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-4 w-4 status-critical" />
                  <span className="status-critical uppercase tracking-widest2">Demo Interaction Alerts</span>
                </div>
                {interactions.map((r, i) => (
                  <div key={i} className="text-xs font-mono">
                    <span className="status-critical">{r.severity}</span> · {r.medications.join(' + ')} — {r.message}
                  </div>
                ))}
                <div className="text-[10px] text-muted-foreground">Demo interaction rules only. Verify with an appropriate clinical reference.</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="tactical-card">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground flex items-center gap-2"><Pill className="h-4 w-4" /> Medication Ledger</CardTitle>
            <AddMedDialog patientId={patient.id} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground mb-2">Active ({active.length})</div>
              <ul className="space-y-2">
                {active.length === 0 && <li className="text-xs text-muted-foreground">No active medications.</li>}
                {active.map(m => (
                  <li key={m.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3">
                    <div className="text-xs font-mono">
                      <div className="text-sm font-sans">{m.name} <span className="text-muted-foreground">· {m.dosage}</span></div>
                      <div className="text-muted-foreground">{m.condition} · {m.frequency} · Rx by {m.prescribingDoctor}</div>
                      <div className="text-muted-foreground">Started {m.startDate}</div>
                    </div>
                    <Button variant="outline" size="sm" data-testid={PATIENT.discontinueMed(m.id)} onClick={() => { discontinue(patient.id, m.id); toast(`${m.name} discontinued`); }}>
                      <StopCircle className="h-4 w-4 mr-1" /> Discontinue
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            {discontinued.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground mb-2">Discontinued ({discontinued.length})</div>
                <ul className="space-y-2">
                  {discontinued.map(m => (
                    <li key={m.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3 opacity-70">
                      <div className="text-xs font-mono">
                        <div className="text-sm font-sans line-through">{m.name}</div>
                        <div className="text-muted-foreground">{m.condition} · {m.dosage}</div>
                      </div>
                      <Button variant="outline" size="sm" data-testid={PATIENT.reactivateMed(m.id)} onClick={() => { reactivate(patient.id, m.id); toast(`${m.name} reactivated`); }}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Reactivate
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
