import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, LineChart, Line, ComposedChart, Cell,
} from 'recharts';
import { useSimulationStore } from '../../store/useSimulationStore';

const AXIS = { stroke: '#64748b', fontSize: 11 };
const GRID = { stroke: '#1e293b' };
const TOOLTIP_STYLE = { background: '#0B1220', border: '1px solid #1e293b', color: '#F8FAFC', fontSize: 12 };

export default function Analytics() {
  const hospitals = useSimulationStore(s => s.hospitals);
  const dispatches = useSimulationStore(s => s.recentDispatches);

  const crimeVsEquip = hospitals.map(h => ({ name: h.name, crime: h.demographics.crimeRate, mri: h.equipment.mri, ct: h.equipment.ct, xray: h.equipment.xray }));
  const pregVsEquip = hospitals.map(h => ({ name: h.name, pregnancy: h.demographics.pregnancyRate, us: h.equipment.ultrasound, doppler: h.equipment.fetalDoppler }));
  const seniorVsArea = hospitals.map(h => {
    const pop = h.demographics.adultPopulation + h.demographics.seniorPopulation;
    return { name: h.name, seniorRatio: +(h.demographics.seniorPopulation / Math.max(pop,1)).toFixed(2), waitingArea: h.waitingArea.squareFeet };
  });
  const bedUtil = hospitals.map(h => ({
    name: h.name.split(' ')[0],
    total: h.capacity.totalBeds,
    available: h.capacity.availableBeds,
    utilPct: Math.round(((h.capacity.totalBeds - h.capacity.availableBeds) / Math.max(h.capacity.totalBeds,1)) * 100),
  }));
  const dispatchDist = dispatches.slice().reverse().map((d, i) => ({ idx: i+1, distance: +Number(d.distance || 0).toFixed(1) }));
  const avgDist = dispatchDist.length ? +(dispatchDist.reduce((a,b) => a+b.distance,0) / dispatchDist.length).toFixed(2) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="tactical-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Crime Rate vs Trauma Imaging Equipment</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={crimeVsEquip}>
              <CartesianGrid {...GRID} strokeDasharray="3 3" />
              <XAxis dataKey="name" {...AXIS} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis {...AXIS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="crime" fill="#EF4444" name="Crime Rate" />
              <Line type="monotone" dataKey="mri" stroke="#3B82F6" name="MRI" strokeWidth={2} />
              <Line type="monotone" dataKey="ct" stroke="#22C55E" name="CT" strokeWidth={2} />
              <Line type="monotone" dataKey="xray" stroke="#FACC15" name="X-Ray" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="tactical-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Pregnancy Rate vs OB Equipment</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={pregVsEquip}>
              <CartesianGrid {...GRID} strokeDasharray="3 3" />
              <XAxis dataKey="name" {...AXIS} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis {...AXIS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="pregnancy" fill="#A855F7" name="Pregnancy Rate" />
              <Line type="monotone" dataKey="us" stroke="#3B82F6" name="Ultrasound" strokeWidth={2} />
              <Line type="monotone" dataKey="doppler" stroke="#F97316" name="Fetal Doppler" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="tactical-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Senior Ratio vs Waiting Area</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid {...GRID} strokeDasharray="3 3" />
              <XAxis type="number" dataKey="seniorRatio" domain={[0, 1]} {...AXIS} name="Senior ratio" />
              <YAxis type="number" dataKey="waitingArea" {...AXIS} name="Waiting sqft" />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={seniorVsArea} fill="#22C55E" name="Hospitals" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="tactical-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Hospital Bed Utilization</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bedUtil}>
              <CartesianGrid {...GRID} strokeDasharray="3 3" />
              <XAxis dataKey="name" {...AXIS} />
              <YAxis {...AXIS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" fill="#334155" name="Total Beds" />
              <Bar dataKey="available" fill="#22C55E" name="Available" />
              <Bar dataKey="utilPct" fill="#EF4444" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="tactical-card lg:col-span-2">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm tracking-widest2 uppercase text-muted-foreground">Dispatch Distance</CardTitle>
          <div className="text-xs font-mono text-muted-foreground">avg: <span className="status-info">{avgDist} km</span></div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dispatchDist}>
              <CartesianGrid {...GRID} strokeDasharray="3 3" />
              <XAxis dataKey="idx" {...AXIS} label={{ value: 'Dispatch #', fill: '#64748b', fontSize: 11, position: 'insideBottom', offset: -2 }} />
              <YAxis {...AXIS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="distance" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
