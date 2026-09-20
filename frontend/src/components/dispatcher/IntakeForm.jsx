import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';
import IncidentMap from './IncidentMap';
import { classify } from '../../lib/classifier';
import { useSimulationStore } from '../../store/useSimulationStore';
import { INTAKE } from '../../constants/testIds/medflow';

const SEV_STYLES = {
  Critical: { key: 'status-critical', bg: 'bg-critical' },
  Severe:   { key: 'status-severe',   bg: 'bg-severe' },
  Moderate: { key: 'status-moderate', bg: 'bg-moderate' },
};

export default function IntakeForm() {
  const patients = useSimulationStore(s => s.patients);
  const dispatchCase = useSimulationStore(s => s.dispatchCase);

  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [location, setLocation] = useState(null);
  const [patientMode, setPatientMode] = useState('none'); // none | existing | new
  const [patientId, setPatientId] = useState('');
  const [newName, setNewName] = useState('');
  const [conditions, setConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');
  const [meds, setMeds] = useState([]);
  const [medDraft, setMedDraft] = useState({ name: '', condition: '', dosage: '', frequency: '', prescribingDoctor: '' });
  const [dispatching, setDispatching] = useState(false);

  const classification = useMemo(() => classify(description), [description]);

  const addCondition = () => {
    const v = conditionInput.trim();
    if (!v) return;
    setConditions(c => [...c, v]);
    setConditionInput('');
  };
  const addMed = () => {
    if (!medDraft.name.trim()) { toast.error('Medication name required'); return; }
    setMeds(m => [...m, { ...medDraft }]);
    setMedDraft({ name: '', condition: '', dosage: '', frequency: '', prescribingDoctor: '' });
  };

  const canDispatch = description.trim().length > 3 && severity && location && !dispatching;

  async function handleDispatch() {
    if (!canDispatch) return;
    setDispatching(true);
    try {
      let patientDraft = null;
      if (patientMode === 'new') {
        patientDraft = { name: newName || 'Unnamed Patient (Simulated)', conditions, medications: meds };
      }
      const res = await dispatchCase({
        description, severity, location,
        patientId: patientMode === 'existing' ? patientId : undefined,
        patientDraft,
      });
      if (res.ok) {
        toast.success(`Case ${res.dispatched.id} dispatched to ${res.dispatched.assignedHospitalName}`, { description: `${classification.primary} • ${res.dispatched.distance.toFixed(1)} km` });
      } else {
        toast.warning(`No eligible hospital available. Case ${res.queued.id} added to holding queue.`);
      }
      // Reset form
      setDescription(''); setSeverity(''); setLocation(null);
      setPatientMode('none'); setPatientId(''); setNewName(''); setConditions([]); setMeds([]);
    } catch (e) {
      toast.error('Dispatch failed: ' + (e.message || 'Unknown error'));
    } finally {
      setDispatching(false);
    }
  }

  return (
    <Card className="tactical-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-sm tracking-widest2 uppercase text-muted-foreground">Trauma Intake</span>
          <Badge variant="outline" className="font-mono text-[10px]">SIMULATED</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest2 text-muted-foreground">Incident Description</Label>
          <Textarea
            data-testid={INTAKE.description}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Gunshot wound to the abdomen with major bleeding..."
            rows={3}
          />
          {description && (
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 pt-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Predicted specialist:</span>
              <Badge className="bg-info text-blue-300 border">{classification.primary}</Badge>
              {classification.secondary.length > 0 && (
                <span className="opacity-70">Secondary: {classification.secondary.join(', ')}</span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest2 text-muted-foreground">Severity</Label>
          <div className="grid grid-cols-3 gap-2">
            {['Critical', 'Severe', 'Moderate'].map(s => (
              <Button
                key={s}
                type="button"
                variant={severity === s ? 'default' : 'outline'}
                onClick={() => setSeverity(s)}
                data-testid={INTAKE[`severity${s}`]}
                className={severity === s ? `${SEV_STYLES[s].bg} border` : ''}
              >
                <span className={SEV_STYLES[s].key}>{s}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest2 text-muted-foreground">Medical Footprint</Label>
          <Select value={patientMode} onValueChange={setPatientMode}>
            <SelectTrigger data-testid={INTAKE.patientMode}><SelectValue placeholder="Select mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No known medical footprint</SelectItem>
              <SelectItem value="existing">Select existing patient</SelectItem>
              <SelectItem value="new">Create new patient footprint</SelectItem>
            </SelectContent>
          </Select>

          {patientMode === 'existing' && (
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger data-testid={INTAKE.patientSelect}><SelectValue placeholder="Choose patient" /></SelectTrigger>
              <SelectContent>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {patientMode === 'new' && (
            <div className="space-y-3 rounded-md border border-border p-3 bg-secondary/40">
              <Input
                data-testid={INTAKE.newPatientName}
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Patient display name (e.g. John Doe — Simulated)"
              />
              <div>
                <Label className="text-[11px] uppercase tracking-widest2 text-muted-foreground">Known Conditions (Diseases)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={conditionInput} onChange={e => setConditionInput(e.target.value)} placeholder="e.g. Hypertension" />
                  <Button type="button" variant="outline" onClick={addCondition} data-testid={INTAKE.addCondition}><Plus className="h-4 w-4" /></Button>
                </div>
                {conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {conditions.map((c, i) => (
                      <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setConditions(list => list.filter((_,idx) => idx !== i))}>
                        {c} <Trash2 className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest2 text-muted-foreground">Current Medications</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input value={medDraft.name} onChange={e => setMedDraft({...medDraft, name: e.target.value})} placeholder="Medication name" />
                  <Input value={medDraft.condition} onChange={e => setMedDraft({...medDraft, condition: e.target.value})} placeholder="For condition" />
                  <Input value={medDraft.dosage} onChange={e => setMedDraft({...medDraft, dosage: e.target.value})} placeholder="Dosage (e.g. 10mg)" />
                  <Input value={medDraft.frequency} onChange={e => setMedDraft({...medDraft, frequency: e.target.value})} placeholder="Frequency" />
                  <Input value={medDraft.prescribingDoctor} onChange={e => setMedDraft({...medDraft, prescribingDoctor: e.target.value})} placeholder="Prescribing doctor" className="col-span-2" />
                </div>
                <Button type="button" variant="outline" onClick={addMed} data-testid={INTAKE.addMedication} className="mt-2 w-full">
                  <Plus className="h-4 w-4 mr-1" /> Add Medication
                </Button>
                {meds.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {meds.map((m, i) => (
                      <li key={i} className="text-xs font-mono flex items-center justify-between border border-border rounded px-2 py-1">
                        <span>{m.name} • {m.dosage || '—'} • {m.condition || '—'}</span>
                        <button className="text-muted-foreground hover:text-destructive" onClick={() => setMeds(list => list.filter((_,idx) => idx !== i))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest2 text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Incident Location — click map</Label>
          <IncidentMap value={location} onChange={setLocation} />
          {location ? (
            <div className="text-xs font-mono text-muted-foreground">
              Location Selected: <span className="status-info">{location.latitude}°, {location.longitude}°</span>
            </div>
          ) : (
            <div className="text-xs font-mono text-muted-foreground">No location selected</div>
          )}
        </div>

        <div className="border border-dashed border-border rounded-md p-3 text-[11px] text-muted-foreground flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 status-moderate" />
          <span>Simulated classification — verify by qualified medical personnel. All hospitals, capacities, and alerts are fictional.</span>
        </div>

        <Button
          onClick={handleDispatch}
          disabled={!canDispatch}
          data-testid={INTAKE.dispatchBtn}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold"
        >
          {dispatching ? 'Dispatching…' : 'Dispatch Trauma Case'}
        </Button>
      </CardContent>
    </Card>
  );
}
