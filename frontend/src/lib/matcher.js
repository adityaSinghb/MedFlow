import { haversineKm } from './formulas';

export function rankHospitals(hospitals, incidentLocation, requiredSpecialist, severity) {
  const eligible = hospitals
    .map(h => {
      const spec = h.specialists.find(s => s.type === requiredSpecialist);
      const distance = haversineKm(incidentLocation, h.location);
      return { h, spec, distance };
    })
    .filter(({ h, spec }) => h.capacity.availableBeds > 0 && spec && spec.available > 0);

  if (eligible.length === 0) return [];

  const maxDist = Math.max(...eligible.map(e => e.distance), 1);

  const isCritical = severity === 'Critical';
  const w = isCritical
    ? { dist: 0.35, bed: 0.25, spec: 0.40 }
    : { dist: 0.45, bed: 0.30, spec: 0.25 };

  const ranked = eligible.map(({ h, spec, distance }) => {
    const distanceScore = 1 - (distance / maxDist);
    const bedScore = h.capacity.availableBeds / h.capacity.totalBeds;
    const specialistScore = spec.available / spec.total;
    const finalScore = w.dist * distanceScore + w.bed * bedScore + w.spec * specialistScore;
    return {
      hospitalId: h.id,
      hospitalName: h.name,
      distance,
      distanceScore,
      bedScore,
      specialistScore,
      finalScore,
      icuAvailable: h.capacity.availableICUBeds > 0,
    };
  }).sort((a, b) => b.finalScore - a.finalScore);

  // For critical cases prefer hospitals with ICU available, but do not disqualify.
  if (isCritical) {
    ranked.sort((a, b) => {
      if (a.icuAvailable !== b.icuAvailable) return a.icuAvailable ? -1 : 1;
      return b.finalScore - a.finalScore;
    });
  }
  return ranked;
}
