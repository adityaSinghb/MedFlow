import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown, Users, Bed, Activity, Stethoscope, Building2, Accessibility } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { toast } from 'sonner';
import { HOSPITAL } from '../../constants/testIds/medflow';

function StatRow({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}{sub ? <span className="text-muted-foreground ml-1">{sub}</span> : null}</span>
    </div>
  );
}

function SpecRow({ s }) {
  const pct = s.total > 0 ? Math.round((s.available / s.total) * 100) : 0;
  const tone = s.available === 0 ? 'status-critical' : s.available < s.total ? 'status-moderate' : 'status-available';
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-xs">
      <span className="text-muted-foreground truncate">{s.type}</span>
      <span className={`font-mono ${tone}`}>{s.available} / {s.total}</span>
      <div className="w-16"><Progress value={pct} className="h-1.5" /></div>
    </div>
  );
}

export default function HospitalCard({ hospital }) {
  const discharge = useSimulationStore(s => s.dischargePatient);
  const [open, setOpen] = useState(false);
  const util = hospital.capacity.totalBeds ? Math.round(((hospital.capacity.totalBeds - hospital.capacity.availableBeds) / hospital.capacity.totalBeds) * 100) : 0;
  const utilTone = util > 80 ? 'status-critical' : util > 60 ? 'status-severe' : util > 40 ? 'status-moderate' : 'status-available';

  const onDischarge = () => {
    const r = discharge(hospital.id);
    if (!r.released) { toast('No active patient to discharge'); return; }
    if (r.redispatched.length > 0) {
      r.redispatched.forEach(d => toast.success(`Holding ${d.id} auto-dispatched to ${d.assignedHospitalName}`));
    } else {
      toast(`1 patient discharged from ${hospital.name}`);
    }
  };

  return (
    <Card className="tactical-card" data-testid={HOSPITAL.card(hospital.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 status-info" /> {hospital.name}</CardTitle>
            <div className="text-[11px] uppercase tracking-widest2 text-muted-foreground mt-1">{hospital.zone}</div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-mono ${utilTone}`}>{util}%</div>
            <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground">Utilization</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground">Crime Rate</div>
            <Progress value={hospital.demographics.crimeRate} className="h-1.5" />
            <div className="text-[11px] font-mono">{hospital.demographics.crimeRate}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground">Pregnancy Rate</div>
            <Progress value={hospital.demographics.pregnancyRate} className="h-1.5" />
            <div className="text-[11px] font-mono">{hospital.demographics.pregnancyRate}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Adults</div>
            <div className="text-[11px] font-mono">{hospital.demographics.adultPopulation.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground flex items-center gap-1"><Accessibility className="h-3 w-3" /> Seniors</div>
            <div className="text-[11px] font-mono">{hospital.demographics.seniorPopulation.toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-border/60 pt-3">
          <StatRow label="Total Beds" value={hospital.capacity.totalBeds} />
          <StatRow label="Available" value={hospital.capacity.availableBeds} />
          <StatRow label="ICU Beds" value={hospital.capacity.totalICUBeds} />
          <StatRow label="ICU Available" value={hospital.capacity.availableICUBeds} />
          <StatRow label="Waiting Area" value={hospital.waitingArea.squareFeet} sub="sqft" />
          <StatRow label="Seats" value={hospital.waitingArea.seatCapacity} />
          <StatRow label="Accessible" value={hospital.waitingArea.accessibleSeats} />
          <StatRow label="Triage Bays" value={hospital.waitingArea.priorityTriageBays} />
        </div>

        <div className="pt-1 border-t border-border/60 pt-3 space-y-2">
          <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground">Equipment</div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="font-mono">MRI {hospital.equipment.mri}</Badge>
            <Badge variant="outline" className="font-mono">CT {hospital.equipment.ct}</Badge>
            <Badge variant="outline" className="font-mono">X-Ray {hospital.equipment.xray}</Badge>
            <Badge variant="outline" className="font-mono">US {hospital.equipment.ultrasound}</Badge>
            <Badge variant="outline" className="font-mono">Doppler {hospital.equipment.fetalDoppler}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {hospital.equipmentBadges.highCrime && <Badge className="bg-critical border text-[10px]"><span className="status-critical">High Crime Allocation</span></Badge>}
            {hospital.equipmentBadges.highPregnancy && <Badge className="bg-info border text-[10px]"><span className="status-info">High Pregnancy Allocation</span></Badge>}
            {hospital.equipmentBadges.highSenior && <Badge className="bg-locked border text-[10px]"><span className="status-locked">Senior Access Expanded</span></Badge>}
          </div>
        </div>

        <div className="pt-1 border-t border-border/60 pt-3 space-y-1">
          <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Specialists</div>
          {hospital.specialists.map(s => <SpecRow key={s.type} s={s} />)}
        </div>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="w-full text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/60 pt-3">
            <span className="uppercase tracking-widest2">Capacity Logic</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="text-[11px] font-mono text-muted-foreground space-y-1 pt-2">
            <div>base_beds = {hospital.capacity.baseBeds} → total = {hospital.capacity.totalBeds}</div>
            <div>base_icu = {hospital.capacity.baseICUBeds} → total_icu = {hospital.capacity.totalICUBeds}</div>
            <div>waiting_sqft = 500 + pop/80 × senior_boost = {hospital.waitingArea.squareFeet}</div>
            <div>equipment_crime_mult ≈ {(1 + 0.5*hospital.demographics.crimeRate/100).toFixed(2)}</div>
            <div>equipment_preg_mult  ≈ {(1 + 0.6*hospital.demographics.pregnancyRate/100).toFixed(2)}</div>
          </CollapsibleContent>
        </Collapsible>

        <Button
          variant="outline"
          className="w-full"
          onClick={onDischarge}
          data-testid={HOSPITAL.discharge(hospital.id)}
        >
          <Activity className="h-4 w-4 mr-2" /> Discharge 1 Patient
          <span className="ml-2 text-xs text-muted-foreground">Active: {hospital.activePatients}</span>
        </Button>
      </CardContent>
    </Card>
  );
}
