// Generate random bins near a given location
export function generateBinsNearLocation(center, radius = 0.02, count = 12) {
  const bins = [];
  const risks = ['Critical', 'High', 'Medium', 'Normal'];
  const wards = ['Ward 14', 'Ward 15', 'Ward 22', 'Ward 23'];
  const locations = ['Market Road', 'MG Road', 'Residency Road', 'Brigade Road', 'Cubbon Park', 'Kasturba Road', 'Richmond Town', 'Indiranagar', 'Koramangala', 'Whitefield', 'Marathahalli', 'Jayanagar'];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const lat = center[0] + distance * Math.cos(angle);
    const lng = center[1] + distance * Math.sin(angle);
    const fill = Math.floor(Math.random() * 100) + 10;
    const riskIdx = fill > 80 ? 0 : fill > 65 ? 1 : fill > 45 ? 2 : 3;
    const risk = risks[riskIdx];
    const overflow = risk === 'Critical' ? `${Math.floor(Math.random() * 3) + 1} hrs` :
                    risk === 'High' ? `${Math.floor(Math.random() * 4) + 4} hrs` :
                    risk === 'Medium' ? `${Math.floor(Math.random() * 5) + 8} hrs` : `${Math.floor(Math.random() * 10) + 14} hrs`;

    bins.push({
      id: String(100 + i),
      ward: `${wards[i % wards.length]} · ${locations[i % locations.length]}`,
      fill,
      overflow,
      risk,
      routeId: '',
      position: [lat, lng]
    });
  }
  return bins;
}

// Static fallback bins
export const mockBins = [
  { id:'102', ward:'Ward 14 · Market Road', fill:91, overflow:'3 hrs', risk:'Critical', routeId:'R-01', position:[12.9723,77.5944] },
  { id:'117', ward:'Ward 14 · MG Road', fill:87, overflow:'5 hrs', risk:'High', routeId:'R-01', position:[12.9699,77.5984] },
  { id:'134', ward:'Ward 15 · Residency Road', fill:78, overflow:'9 hrs', risk:'Medium', routeId:'R-01', position:[12.9657,77.6010] },
  { id:'148', ward:'Ward 15 · Brigade Road', fill:62, overflow:'18 hrs', risk:'Normal', routeId:'R-01', position:[12.9668,77.6071] },
  { id:'203', ward:'Ward 22 · Cubbon Park', fill:82, overflow:'7 hrs', risk:'Medium', routeId:'R-02', position:[12.9778,77.5925] },
  { id:'211', ward:'Ward 22 · Kasturba Road', fill:75, overflow:'11 hrs', risk:'High', routeId:'R-02', position:[12.9750,77.5880] },
  { id:'226', ward:'Ward 23 · Richmond Town', fill:68, overflow:'14 hrs', risk:'Normal', routeId:'R-02', position:[12.9605,77.5962] }
];
