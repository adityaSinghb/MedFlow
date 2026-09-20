import React from 'react';
import HospitalCard from './HospitalCard';
import { useSimulationStore } from '../../store/useSimulationStore';

export default function HospitalNetwork() {
  const hospitals = useSimulationStore(s => s.hospitals);
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Hospital Capacity Network</h2>
        <p className="text-xs text-muted-foreground">Synthetic zones — resources scale via crime, pregnancy, and senior demographic multipliers.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {hospitals.map(h => <HospitalCard key={h.id} hospital={h} />)}
      </div>
    </div>
  );
}
