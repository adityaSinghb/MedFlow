import { create } from 'zustand';
import axios from 'axios';
import { buildInitialHospitals, buildInitialPatients, DEMO_INTERACTIONS, SURGE_DESCRIPTIONS, randomIncidentLocation } from '../lib/mockData';
import { classify } from '../lib/classifier';
import { rankHospitals } from '../lib/matcher';
import { haversineKm } from '../lib/formulas';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

let caseCounter = 1000;
const nextCaseId = () => `MF-${++caseCounter}`;
const nowIso = () => new Date().toISOString();
const nowClock = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

function severityRank(s) { return s === 'Critical' ? 3 : s === 'Severe' ? 2 : 1; }

function serializable(state) {
  return {
    hospitals: state.hospitals,
    patients: state.patients,
    holdingQueue: state.holdingQueue,
    recentDispatches: state.recentDispatches,
    dispatchLogs: state.dispatchLogs.slice(-200),
    totalCases: state.totalCases,
    caseCounter,
  };
}

export const useSimulationStore = create((set, get) => ({
  hospitals: buildInitialHospitals(),
  patients: buildInitialPatients(),
  holdingQueue: [],
  recentDispatches: [],
  dispatchLogs: [],
  totalCases: 0,
  loading: true,
  theme: 'dark',

  // --- persistence ---
  async loadState() {
    try {
      const res = await axios.get(`${API}/state`);
      if (res.data?.state) {
        const s = res.data.state;
        caseCounter = s.caseCounter || caseCounter;
        set({
          hospitals: s.hospitals || buildInitialHospitals(),
          patients: s.patients || buildInitialPatients(),
          holdingQueue: s.holdingQueue || [],
          recentDispatches: s.recentDispatches || [],
          dispatchLogs: s.dispatchLogs || [],
          totalCases: s.totalCases || 0,
          loading: false,
        });
      } else {
        set({ loading: false });
        await get().persist();
      }
    } catch (e) {
      console.error('loadState failed', e);
      set({ loading: false });
    }
  },
  async persist() {
    try {
      await axios.put(`${API}/state`, { state: serializable(get()) });
    } catch (e) {
      console.error('persist failed', e);
    }
  },

  setTheme(theme) { set({ theme }); },
  toggleTheme() { set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })); },

  addLog(msg, tone = 'info') {
    const line = { id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, ts: nowClock(), msg, tone };
    set(s => ({ dispatchLogs: [...s.dispatchLogs, line].slice(-200) }));
    return line;
  },

  // --- patients ---
  upsertPatient(patient) {
    set(s => {
      const idx = s.patients.findIndex(p => p.id === patient.id);
      const list = [...s.patients];
      const updated = { ...patient, updatedAt: nowIso() };
      if (idx >= 0) list[idx] = updated; else list.push(updated);
      return { patients: list };
    });
    get().persist();
  },

  addMedication(patientId, med) {
    set(s => ({
      patients: s.patients.map(p => {
        if (p.id !== patientId) return p;
        const dup = p.medications.find(m => m.name.toLowerCase() === med.name.toLowerCase() && m.status === 'active');
        if (dup) throw new Error('Duplicate active medication');
        return { ...p, medications: [...p.medications, { ...med, id: `MED-${Date.now()}`, status: 'active', changeHistory: [{ ts: nowIso(), action: 'added' }] }], updatedAt: nowIso() };
      })
    }));
    get().persist();
  },
  discontinueMedication(patientId, medId) {
    set(s => ({
      patients: s.patients.map(p => p.id !== patientId ? p : ({
        ...p, updatedAt: nowIso(),
        medications: p.medications.map(m => m.id !== medId ? m : ({
          ...m, status: 'discontinued', changeHistory: [...m.changeHistory, { ts: nowIso(), action: 'discontinued' }],
        }))
      }))
    }));
    get().persist();
  },
  reactivateMedication(patientId, medId) {
    set(s => ({
      patients: s.patients.map(p => p.id !== patientId ? p : ({
        ...p, updatedAt: nowIso(),
        medications: p.medications.map(m => m.id !== medId ? m : ({
          ...m, status: 'active', changeHistory: [...m.changeHistory, { ts: nowIso(), action: 'reactivated' }],
        }))
      }))
    }));
    get().persist();
  },
  updateMedication(patientId, medId, changes) {
    set(s => ({
      patients: s.patients.map(p => p.id !== patientId ? p : ({
        ...p, updatedAt: nowIso(),
        medications: p.medications.map(m => m.id !== medId ? m : ({
          ...m, ...changes, changeHistory: [...m.changeHistory, { ts: nowIso(), action: 'updated' }],
        }))
      }))
    }));
    get().persist();
  },

  getInteractions(patient) {
    if (!patient) return [];
    const active = new Set(patient.medications.filter(m => m.status === 'active').map(m => m.name.toLowerCase()));
    return DEMO_INTERACTIONS.filter(rule => rule.medications.every(m => active.has(m.toLowerCase())));
  },

  // --- dispatch ---
  async dispatchCase({ description, severity, location, patientId, patientDraft }) {
    const caseId = nextCaseId();
    const cls = classify(description);

    // If patientDraft, upsert new patient
    let pid = patientId;
    if (patientDraft) {
      const newPid = `PT-${Date.now()}`;
      const alerts = [];
      patientDraft.conditions.forEach(c => {
        const t = c.toLowerCase();
        if (t.includes('diabet')) alerts.push('Diabetes');
        if (t.includes('hyperten')) alerts.push('Hypertension');
        if (t.includes('fib') || t.includes('cardiac')) alerts.push('Cardiac History');
        if (t.includes('allerg')) alerts.push('Allergy');
      });
      patientDraft.medications.forEach(m => {
        const t = m.name.toLowerCase();
        if (t.includes('warfarin') || t.includes('heparin')) { alerts.push('Blood Thinners'); alerts.push('Anticoagulant'); }
      });
      const meds = patientDraft.medications.map((m, i) => ({
        id: `MED-${Date.now()}-${i}`, name: m.name, condition: m.condition || '', dosage: m.dosage || '', frequency: m.frequency || '', prescribingDoctor: m.prescribingDoctor || 'Unknown', startDate: m.startDate || new Date().toISOString().slice(0,10), status: 'active', changeHistory: [{ ts: nowIso(), action: 'added' }],
      }));
      const newPatient = { id: newPid, name: patientDraft.name || 'Unnamed Patient (Simulated)', medicalConditions: patientDraft.conditions, medications: meds, alerts: [...new Set(alerts)], updatedAt: nowIso() };
      set(s => ({ patients: [...s.patients, newPatient] }));
      pid = newPid;
    }

    const traumaCase = {
      id: caseId, description, severity, location, patientId: pid,
      requiredSpecialist: cls.primary, classificationReason: cls.reason, secondary: cls.secondary,
      status: 'classifying', createdAt: nowIso(),
    };

    const { addLog } = get();
    addLog(`Case ${caseId} received`, 'info');
    addLog(`Parsing incident description...`, 'muted');
    addLog(`Specialist classification: ${cls.primary}${cls.secondary.length ? ' (+' + cls.secondary.join(', ') + ')' : ''}`, 'info');

    const ranked = rankHospitals(get().hospitals, location, cls.primary, severity);
    addLog(`Evaluating hospital network...`, 'muted');
    addLog(`${get().hospitals.length} hospitals evaluated, ${ranked.length} eligible`, 'muted');

    for (const cand of ranked) {
      const hosp = get().hospitals.find(h => h.id === cand.hospitalId);
      const spec = hosp.specialists.find(s => s.type === cls.primary);
      if (hosp.capacity.availableBeds <= 0 || !spec || spec.available <= 0) continue;

      addLog(`Best candidate: ${hosp.name}`, 'info');
      addLog(`Checking bed availability... OK (${hosp.capacity.availableBeds}/${hosp.capacity.totalBeds})`, 'muted');
      addLog(`Checking specialist availability... OK (${spec.available}/${spec.total})`, 'muted');

      // Atomic lock
      set(s => ({
        hospitals: s.hospitals.map(h => {
          if (h.id !== hosp.id) return h;
          return {
            ...h,
            capacity: { ...h.capacity, availableBeds: h.capacity.availableBeds - 1 },
            activePatients: h.activePatients + 1,
            specialists: h.specialists.map(sp => sp.type !== cls.primary ? sp : ({ ...sp, available: sp.available - 1, locked: sp.locked + 1 })),
          };
        }),
      }));
      addLog(`Resources locked at ${hosp.name}`, 'success');
      addLog(`Specialist alert simulated (${cls.primary})`, 'info');

      const dispatched = {
        ...traumaCase,
        status: 'dispatched',
        assignedHospitalId: hosp.id,
        assignedHospitalName: hosp.name,
        distance: cand.distance,
        scoreDetails: cand,
        dispatchedAt: nowIso(),
      };
      set(s => ({
        recentDispatches: [dispatched, ...s.recentDispatches].slice(0, 20),
        totalCases: s.totalCases + 1,
      }));
      addLog(`Dispatch confirmed → ${hosp.name}`, 'success');
      await get().persist();
      return { ok: true, dispatched };
    }

    // Queue
    addLog(`No eligible hospital available — added to holding queue`, 'warn');
    const queued = { ...traumaCase, status: 'holding', queuedAt: nowIso() };
    set(s => ({ holdingQueue: [...s.holdingQueue, queued], totalCases: s.totalCases + 1 }));
    await get().persist();
    return { ok: false, queued };
  },

  // Try to re-dispatch queued cases; returns list of dispatched case ids.
  tryRedispatch() {
    const results = [];
    let queue = [...get().holdingQueue].sort((a, b) => {
      const s = severityRank(b.severity) - severityRank(a.severity);
      if (s !== 0) return s;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    const remaining = [];
    for (const c of queue) {
      const ranked = rankHospitals(get().hospitals, c.location, c.requiredSpecialist, c.severity);
      let dispatched = null;
      for (const cand of ranked) {
        const hosp = get().hospitals.find(h => h.id === cand.hospitalId);
        const spec = hosp.specialists.find(s => s.type === c.requiredSpecialist);
        if (hosp.capacity.availableBeds <= 0 || !spec || spec.available <= 0) continue;
        set(s => ({
          hospitals: s.hospitals.map(h => {
            if (h.id !== hosp.id) return h;
            return {
              ...h,
              capacity: { ...h.capacity, availableBeds: h.capacity.availableBeds - 1 },
              activePatients: h.activePatients + 1,
              specialists: h.specialists.map(sp => sp.type !== c.requiredSpecialist ? sp : ({ ...sp, available: sp.available - 1, locked: sp.locked + 1 })),
            };
          }),
        }));
        dispatched = { ...c, status: 'dispatched', assignedHospitalId: hosp.id, assignedHospitalName: hosp.name, distance: cand.distance, scoreDetails: cand, dispatchedAt: nowIso() };
        set(s => ({ recentDispatches: [dispatched, ...s.recentDispatches].slice(0, 20) }));
        get().addLog(`Holding ${c.id} auto-dispatched → ${hosp.name}`, 'success');
        results.push(dispatched);
        break;
      }
      if (!dispatched) remaining.push(c);
    }
    set({ holdingQueue: remaining });
    get().persist();
    return results;
  },

  dischargePatient(hospitalId) {
    let released = false;
    set(s => ({
      hospitals: s.hospitals.map(h => {
        if (h.id !== hospitalId) return h;
        if (h.activePatients <= 0) return h;
        released = true;
        // Release one specialist from the roster with most locked
        let released_type = null;
        const specs = h.specialists.map(sp => ({ ...sp }));
        const lockedList = specs.filter(sp => sp.locked > 0).sort((a,b) => b.locked - a.locked);
        if (lockedList.length > 0) {
          released_type = lockedList[0].type;
          for (const sp of specs) {
            if (sp.type === released_type && sp.locked > 0) { sp.locked -= 1; sp.available += 1; break; }
          }
        }
        return {
          ...h,
          capacity: { ...h.capacity, availableBeds: Math.min(h.capacity.totalBeds, h.capacity.availableBeds + 1) },
          activePatients: h.activePatients - 1,
          specialists: specs,
        };
      })
    }));
    if (released) get().addLog(`1 patient discharged`, 'muted');
    const redispatched = get().tryRedispatch();
    get().persist();
    return { released, redispatched };
  },

  async simulateSurge(count = 7) {
    const results = [];
    for (let i = 0; i < count; i++) {
      const pick = SURGE_DESCRIPTIONS[Math.floor(Math.random() * SURGE_DESCRIPTIONS.length)];
      const loc = randomIncidentLocation();
      const patients = get().patients;
      const linkPatient = Math.random() > 0.5 ? patients[Math.floor(Math.random() * patients.length)]?.id : undefined;
      const r = await get().dispatchCase({ description: pick.desc, severity: pick.sev, location: loc, patientId: linkPatient });
      results.push(r);
      await new Promise(r => setTimeout(r, 220));
    }
    return results;
  },

  async resetSimulation() {
    caseCounter = 1000;
    set({
      hospitals: buildInitialHospitals(),
      patients: buildInitialPatients(),
      holdingQueue: [],
      recentDispatches: [],
      dispatchLogs: [{ id: 'reset', ts: nowClock(), msg: 'Simulation restored to initial state.', tone: 'success' }],
      totalCases: 0,
    });
    await get().persist();
  },

  // Derived stats
  networkStats() {
    const { hospitals, holdingQueue, recentDispatches, totalCases } = get();
    const totalBeds = hospitals.reduce((a, h) => a + h.capacity.totalBeds, 0);
    const usedBeds = hospitals.reduce((a, h) => a + (h.capacity.totalBeds - h.capacity.availableBeds), 0);
    const utilization = totalBeds > 0 ? Math.round((usedBeds / totalBeds) * 100) : 0;
    const distances = recentDispatches.filter(d => typeof d.distance === 'number').map(d => d.distance);
    const avgDistance = distances.length ? (distances.reduce((a, b) => a + b, 0) / distances.length) : 0;
    return { totalCases, utilization, holding: holdingQueue.length, avgDistance };
  },
}));

export const NETWORK_CENTER = { latitude: 40.7580, longitude: -73.9855 };
