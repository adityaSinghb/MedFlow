import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Activity, Radar, Users, Zap, RotateCw, Sun, Moon } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { HEADER } from '../constants/testIds/medflow';
import { toast } from 'sonner';

function Stat({ label, value, id }) {
  return (
    <div className="flex flex-col items-start" data-testid={id}>
      <span className="text-[10px] uppercase tracking-widest2 text-muted-foreground">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export default function Header({ onTabChange, onOpenNewCase, onOpenPatients }) {
  const hospitals = useSimulationStore(s => s.hospitals);
  const holding = useSimulationStore(s => s.holdingQueue.length);
  const totalCases = useSimulationStore(s => s.totalCases);
  const recentDispatches = useSimulationStore(s => s.recentDispatches);
  const totalBeds = hospitals.reduce((a, h) => a + h.capacity.totalBeds, 0);
  const usedBeds = hospitals.reduce((a, h) => a + (h.capacity.totalBeds - h.capacity.availableBeds), 0);
  const utilization = totalBeds > 0 ? Math.round((usedBeds / totalBeds) * 100) : 0;
  const distances = recentDispatches.filter(d => typeof d.distance === 'number').map(d => d.distance);
  const avgDistance = distances.length ? (distances.reduce((a, b) => a + b, 0) / distances.length) : 0;
  const stats = { totalCases, utilization, holding, avgDistance };
  const surge = useSimulationStore(s => s.simulateSurge);
  const reset = useSimulationStore(s => s.resetSimulation);
  const theme = useSimulationStore(s => s.theme);
  const toggleTheme = useSimulationStore(s => s.toggleTheme);
  const [surging, setSurging] = useState(false);

  const handleSurge = async () => {
    setSurging(true);
    toast('Simulating network surge — 7 synthetic cases inbound');
    await surge(7);
    setSurging(false);
    toast.success('Surge complete');
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/70 border-b border-border">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-3" data-testid={HEADER.logo}>
          <div className="h-9 w-9 rounded-md bg-red-600/15 border border-red-500/40 flex items-center justify-center">
            <Radar className="h-5 w-5 status-critical" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">MedFlow</div>
            <div className="text-[10px] uppercase tracking-widest2 text-muted-foreground">Trauma Resource Network</div>
          </div>
          <Badge className="ml-2 bg-available border font-mono text-[10px]" data-testid={HEADER.live}>
            <span className="live-dot inline-block h-2 w-2 rounded-full mr-2 align-middle" />
            <span className="status-available align-middle">NETWORK LIVE</span>
          </Badge>
        </div>

        <div className="hidden md:flex items-center gap-6 pl-6 border-l border-border">
          <Stat label="Cases" value={stats.totalCases} id={HEADER.statCases} />
          <Stat label="Util." value={`${stats.utilization}%`} id={HEADER.statUtilization} />
          <Stat label="Holding" value={stats.holding} id={HEADER.statQueue} />
          <Stat label="Avg km" value={stats.avgDistance.toFixed(1)} id={HEADER.statDistance} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenNewCase} data-testid={HEADER.btnNewCase}>
            <Zap className="h-4 w-4 mr-1 status-critical" /> New Case
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenPatients} data-testid={HEADER.btnPatientFootprint}>
            <Users className="h-4 w-4 mr-1" /> Patient Footprint
          </Button>
          <Button size="sm" onClick={handleSurge} disabled={surging} data-testid={HEADER.btnSurge} className="bg-orange-600 hover:bg-orange-500 text-white">
            <Activity className="h-4 w-4 mr-1" /> {surging ? 'Surging…' : 'Simulate Surge'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid={HEADER.btnReset}>
                <RotateCw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset simulation?</AlertDialogTitle>
                <AlertDialogDescription>
                  Reset the simulation and restore the initial network state? This clears queues, dispatches and logs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={async () => { await reset(); toast.success('Simulation restored to initial state.'); }}>Reset Simulation</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid={HEADER.themeToggle} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
