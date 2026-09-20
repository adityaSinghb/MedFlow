export const HEADER = {
  logo: 'medflow-logo',
  live: 'network-live-indicator',
  statCases: 'stat-cases',
  statUtilization: 'stat-utilization',
  statQueue: 'stat-queue',
  statDistance: 'stat-distance',
  btnNewCase: 'btn-new-case',
  btnPatientFootprint: 'btn-patient-footprint',
  btnSurge: 'btn-simulate-surge',
  btnReset: 'btn-reset-simulation',
  themeToggle: 'theme-toggle',
};

export const TABS = {
  dispatcher: 'tab-dispatcher',
  hospitals: 'tab-hospitals',
  patients: 'tab-patients',
  analytics: 'tab-analytics',
};

export const INTAKE = {
  description: 'intake-description',
  severityCritical: 'severity-critical',
  severitySevere: 'severity-severe',
  severityModerate: 'severity-moderate',
  patientMode: 'intake-patient-mode',
  patientSelect: 'intake-patient-select',
  newPatientName: 'intake-new-patient-name',
  addCondition: 'intake-add-condition',
  addMedication: 'intake-add-medication',
  map: 'intake-map',
  dispatchBtn: 'intake-dispatch-btn',
};

export const DISPATCH = {
  feed: 'dispatch-feed',
  queueItem: (id) => `queue-item-${id}`,
  recentItem: (id) => `recent-item-${id}`,
};

export const HOSPITAL = {
  card: (id) => `hospital-card-${id}`,
  discharge: (id) => `discharge-btn-${id}`,
};

export const PATIENT = {
  addMed: 'patient-add-med',
  discontinueMed: (id) => `discontinue-med-${id}`,
  reactivateMed: (id) => `reactivate-med-${id}`,
  editMed: (id) => `edit-med-${id}`,
};
