// Synthetic simulation data — clearly fictional. NOT clinical.
import { computeCapacity, computeEquipment, computeWaitingArea } from './formulas';

const HOSPITAL_SEEDS = [
  {
    id: 'HSP-METRO', name: 'Metro Central', zone: 'High Crime Zone',
    location: { latitude: 40.7580, longitude: -73.9855 },
    demographics: { crimeRate: 78, pregnancyRate: 22, adultPopulation: 240000, seniorPopulation: 40000 },
    capacityBase: { baseBeds: 220, baseICUBeds: 40 },
    equipmentBase: { mri: 4, ct: 5, xray: 8, ultrasound: 3, fetalDoppler: 2 },
    specialistSeed: [
      { type: 'Trauma Surgeon', total: 5 },
      { type: 'Neurosurgeon', total: 3 },
      { type: 'OB-GYN', total: 2 },
      { type: 'Orthopedic', total: 3 },
      { type: 'Burn Specialist', total: 2 },
      { type: 'General Surgeon', total: 4 },
    ],
  },
  {
    id: 'HSP-STJUDE', name: "St. Jude's Medical Center", zone: 'High Pregnancy Zone',
    location: { latitude: 40.7295, longitude: -74.0031 },
    demographics: { crimeRate: 25, pregnancyRate: 74, adultPopulation: 180000, seniorPopulation: 25000 },
    capacityBase: { baseBeds: 180, baseICUBeds: 24 },
    equipmentBase: { mri: 2, ct: 3, xray: 5, ultrasound: 6, fetalDoppler: 5 },
    specialistSeed: [
      { type: 'Trauma Surgeon', total: 2 },
      { type: 'Neurosurgeon', total: 2 },
      { type: 'OB-GYN', total: 6 },
      { type: 'Orthopedic', total: 2 },
      { type: 'Burn Specialist', total: 1 },
      { type: 'General Surgeon', total: 3 },
    ],
  },
  {
    id: 'HSP-SUBURB', name: 'Suburban North Hospital', zone: 'High Senior Demographic Zone',
    location: { latitude: 40.8340, longitude: -73.9455 },
    demographics: { crimeRate: 18, pregnancyRate: 12, adultPopulation: 90000, seniorPopulation: 140000 },
    capacityBase: { baseBeds: 160, baseICUBeds: 20 },
    equipmentBase: { mri: 2, ct: 3, xray: 4, ultrasound: 3, fetalDoppler: 1 },
    specialistSeed: [
      { type: 'Trauma Surgeon', total: 2 },
      { type: 'Neurosurgeon', total: 2 },
      { type: 'OB-GYN', total: 2 },
      { type: 'Orthopedic', total: 4 },
      { type: 'Burn Specialist', total: 1 },
      { type: 'General Surgeon', total: 3 },
    ],
  },
  {
    id: 'HSP-RIVER', name: 'Riverside General', zone: 'Balanced Zone',
    location: { latitude: 40.7128, longitude: -74.0060 },
    demographics: { crimeRate: 42, pregnancyRate: 40, adultPopulation: 160000, seniorPopulation: 60000 },
    capacityBase: { baseBeds: 200, baseICUBeds: 28 },
    equipmentBase: { mri: 3, ct: 4, xray: 6, ultrasound: 4, fetalDoppler: 3 },
    specialistSeed: [
      { type: 'Trauma Surgeon', total: 3 },
      { type: 'Neurosurgeon', total: 2 },
      { type: 'OB-GYN', total: 3 },
      { type: 'Orthopedic', total: 3 },
      { type: 'Burn Specialist', total: 2 },
      { type: 'General Surgeon', total: 4 },
    ],
  },
  {
    id: 'HSP-EAST', name: 'Eastside Trauma Institute', zone: 'Trauma Specialization Zone',
    location: { latitude: 40.7484, longitude: -73.9385 },
    demographics: { crimeRate: 65, pregnancyRate: 28, adultPopulation: 210000, seniorPopulation: 35000 },
    capacityBase: { baseBeds: 240, baseICUBeds: 48 },
    equipmentBase: { mri: 5, ct: 6, xray: 8, ultrasound: 3, fetalDoppler: 2 },
    specialistSeed: [
      { type: 'Trauma Surgeon', total: 6 },
      { type: 'Neurosurgeon', total: 4 },
      { type: 'OB-GYN', total: 2 },
      { type: 'Orthopedic', total: 4 },
      { type: 'Burn Specialist', total: 3 },
      { type: 'General Surgeon', total: 4 },
    ],
  },
];

export function buildInitialHospitals() {
  return HOSPITAL_SEEDS.map(seed => {
    const capBase = { baseBeds: seed.capacityBase.baseBeds, baseICUBeds: seed.capacityBase.baseICUBeds };
    const dyn = computeCapacity({ demographics: seed.demographics, capacity: capBase });
    const wait = computeWaitingArea({ demographics: seed.demographics });
    const equip = computeEquipment({ demographics: seed.demographics, equipmentBase: seed.equipmentBase });
    return {
      id: seed.id,
      name: seed.name,
      zone: seed.zone,
      location: seed.location,
      demographics: seed.demographics,
      capacity: {
        baseBeds: capBase.baseBeds,
        baseICUBeds: capBase.baseICUBeds,
        totalBeds: dyn.totalBeds,
        availableBeds: dyn.totalBeds,
        totalICUBeds: dyn.totalICUBeds,
        availableICUBeds: dyn.totalICUBeds,
      },
      waitingArea: {
        squareFeet: wait.squareFeet,
        seatCapacity: wait.seatCapacity,
        accessibleSeats: wait.accessibleSeats,
        priorityTriageBays: wait.priorityTriageBays,
      },
      equipmentBase: seed.equipmentBase,
      equipment: {
        mri: equip.mri, ct: equip.ct, xray: equip.xray,
        ultrasound: equip.ultrasound, fetalDoppler: equip.fetalDoppler,
      },
      equipmentBadges: {
        highCrime: seed.demographics.crimeRate >= 55,
        highPregnancy: seed.demographics.pregnancyRate >= 55,
        highSenior: wait.seniorRatio >= 0.35,
      },
      specialists: seed.specialistSeed.map(s => ({
        type: s.type, total: s.total, available: s.total, locked: 0,
      })),
      activePatients: 0,
    };
  });
}

export function buildInitialPatients() {
  return [
    {
      id: 'PT-001', name: 'Alex Rivera (Simulated)',
      medicalConditions: ['Hypertension', 'Type-2 Diabetes'],
      medications: [
        { id: 'MED-1', name: 'Metformin', condition: 'Type-2 Diabetes', dosage: '500 mg', frequency: 'Twice daily', prescribingDoctor: 'Dr. K. Patel', startDate: '2024-04-11', status: 'active', changeHistory: [] },
        { id: 'MED-2', name: 'Lisinopril', condition: 'Hypertension', dosage: '10 mg', frequency: 'Once daily', prescribingDoctor: 'Dr. K. Patel', startDate: '2023-11-02', status: 'active', changeHistory: [] },
      ],
      alerts: ['Diabetes', 'Hypertension'],
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'PT-002', name: 'Jordan Lee (Simulated)',
      medicalConditions: ['Atrial Fibrillation'],
      medications: [
        { id: 'MED-3', name: 'Warfarin', condition: 'Atrial Fibrillation', dosage: '5 mg', frequency: 'Once daily', prescribingDoctor: 'Dr. M. Chen', startDate: '2024-07-19', status: 'active', changeHistory: [] },
      ],
      alerts: ['Blood Thinners', 'Anticoagulant', 'Cardiac History'],
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'PT-003', name: 'Priya Singh (Simulated)',
      medicalConditions: ['Seasonal Allergy'],
      medications: [
        { id: 'MED-4', name: 'Cetirizine', condition: 'Seasonal Allergy', dosage: '10 mg', frequency: 'As needed', prescribingDoctor: 'Dr. R. Kaur', startDate: '2024-02-20', status: 'active', changeHistory: [] },
      ],
      alerts: ['Allergy'],
      updatedAt: new Date().toISOString(),
    },
  ];
}

// Demo interaction rules — clearly labelled as fictional.
export const DEMO_INTERACTIONS = [
  {
    medications: ['Warfarin', 'Ibuprofen'],
    severity: 'High',
    message: 'Demo interaction rule triggered — anticoagulant + NSAID combination flagged.',
  },
  {
    medications: ['Metformin', 'Contrast Dye'],
    severity: 'Medium',
    message: 'Demo interaction rule triggered — verify prior to imaging with contrast.',
  },
  {
    medications: ['Lisinopril', 'Potassium Chloride'],
    severity: 'Medium',
    message: 'Demo interaction rule triggered — monitor serum potassium.',
  },
];

export const SURGE_DESCRIPTIONS = [
  { desc: 'Gunshot wound to the abdomen with major bleeding', sev: 'Critical' },
  { desc: 'Multi-vehicle collision, head trauma, unconscious victim', sev: 'Critical' },
  { desc: 'Pregnant patient with contractions and fetal distress', sev: 'Severe' },
  { desc: 'Chemical burn on both arms from workplace incident', sev: 'Severe' },
  { desc: 'Open femur fracture after fall from height', sev: 'Severe' },
  { desc: 'Stabbing injury to chest, penetrating injury reported', sev: 'Critical' },
  { desc: 'Seizure and spinal trauma after diving accident', sev: 'Critical' },
  { desc: 'Dislocation of shoulder from sports collision', sev: 'Moderate' },
  { desc: 'Thermal injury from house fire, second-degree burns', sev: 'Severe' },
  { desc: 'Broken bone in wrist after cycling accident', sev: 'Moderate' },
];

export function randomIncidentLocation() {
  // NYC-ish bounding box
  const lat = 40.70 + Math.random() * 0.20;
  const lon = -74.03 + Math.random() * 0.15;
  return { latitude: +lat.toFixed(4), longitude: +lon.toFixed(4) };
}
