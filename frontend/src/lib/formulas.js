// Deterministic capacity formulas as per MedFlow spec.

export function computeCapacity(h) {
  const crimeFactor = (h.demographics?.crimeRate ?? 0) / 100;
  const pregnancyFactor = (h.demographics?.pregnancyRate ?? 0) / 100;

  const totalBeds = Math.round(h.capacity.baseBeds * (1 + 0.30 * crimeFactor) * (1 + 0.20 * pregnancyFactor));
  const totalICUBeds = Math.round(h.capacity.baseICUBeds * (1 + 0.40 * crimeFactor));

  return { totalBeds, totalICUBeds };
}

export function computeEquipment(h) {
  const crimeFactor = (h.demographics?.crimeRate ?? 0) / 100;
  const pregnancyFactor = (h.demographics?.pregnancyRate ?? 0) / 100;
  const cm = 1 + 0.50 * crimeFactor;
  const pm = 1 + 0.60 * pregnancyFactor;
  const base = h.equipmentBase;
  return {
    mri: Math.round(base.mri * cm),
    ct: Math.round(base.ct * cm),
    xray: Math.round(base.xray * cm),
    ultrasound: Math.round(base.ultrasound * pm),
    fetalDoppler: Math.round(base.fetalDoppler * pm),
    crimeMultiplier: cm,
    pregnancyMultiplier: pm,
  };
}

export function computeWaitingArea(h) {
  const adult = h.demographics.adultPopulation ?? 0;
  const senior = h.demographics.seniorPopulation ?? 0;
  const population = adult + senior;
  const seniorRatio = senior / Math.max(population, 1);

  let sqft = Math.round(500 + population / 80);
  const accessibilityMultiplier = 1 + seniorRatio * 0.40;
  sqft = Math.round(sqft * accessibilityMultiplier);

  const seatCapacity = Math.max(10, Math.floor(sqft / 18));
  const accessibleSeats = Math.max(2, Math.ceil(seatCapacity * (0.10 + seniorRatio * 0.20)));
  const priorityTriageBays = Math.max(1, Math.ceil(seniorRatio * 6));

  return { squareFeet: sqft, seatCapacity, accessibleSeats, priorityTriageBays, seniorRatio };
}

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const la1 = toRad(a.latitude);
  const la2 = toRad(b.latitude);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
