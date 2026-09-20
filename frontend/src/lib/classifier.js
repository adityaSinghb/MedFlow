// Deterministic keyword classifier for specialist matching.

const GROUPS = [
  { type: 'OB-GYN',        keywords: ['pregnancy','pregnant','contractions','labor','labour','fetal distress','childbirth'] },
  { type: 'Neurosurgeon',  keywords: ['head trauma','brain injury','skull','unconscious','seizure','spinal trauma'] },
  { type: 'Trauma Surgeon',keywords: ['gunshot','stab','stabbing','penetrating injury','major bleeding','severe trauma','multiple injuries'] },
  { type: 'Burn Specialist',keywords: ['burn','burns','thermal injury','chemical burn'] },
  { type: 'Orthopedic',    keywords: ['fracture','broken bone','dislocation','femur','orthopedic injury'] },
];

export function classify(description) {
  const text = (description || '').toLowerCase();
  const matches = [];
  for (const g of GROUPS) {
    const hits = g.keywords.filter(k => text.includes(k));
    if (hits.length > 0) matches.push({ type: g.type, hits });
  }
  if (matches.length === 0) {
    return {
      primary: 'General Surgeon',
      secondary: [],
      reason: 'No specific keywords matched — defaulting to General Surgeon.',
      matches: [],
    };
  }
  const primary = matches[0];
  const secondary = matches.slice(1).map(m => m.type);
  return {
    primary: primary.type,
    secondary,
    reason: `Keyword matches: ${primary.hits.join(', ')}${secondary.length ? ' • Secondary considerations: ' + secondary.join(', ') : ''}`,
    matches,
  };
}
