import { mockRoutes } from '../data/mockRoutes';
import { mockBins, generateBinsNearLocation } from '../data/mockBins';
import { mockDrivers } from '../data/mockDrivers';

const delayed = (data, ms=400) => new Promise(resolve => setTimeout(() => resolve(structuredClone(data)), ms));

// State to track current location and bins
let currentBins = [...mockBins];
let currentLocation = null;

// Haversine formula to calculate distance between two lat/lng points (in km)
const calculateDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2[0] - point1[0]) * Math.PI) / 180;
  const dLng = ((point2[1] - point1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1[0] * Math.PI) / 180) *
      Math.cos((point2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Nearest neighbor algorithm to optimize route
const nearestNeighborRoute = (depot, bins, truckId, driverId, routeId) => {
  if (bins.length === 0) {
    return {
      id: routeId,
      truck: truckId,
      driver: driverId,
      bins: 0,
      distance: '0 km',
      eta: '0 min',
      priority: 'Normal',
      status: 'Ready',
      color: '#8b5cf6',
      points: [depot],
      stops: 'Depot',
      binsOrdered: []
    };
  }

  const unvisited = [...bins];
  const route = [depot];
  const binsOrdered = [];
  let totalDistance = 0;
  let currentPos = depot;

  // Nearest neighbor: always go to the nearest unvisited bin
  while (unvisited.length > 0) {
    let nearest = unvisited[0];
    let nearestIdx = 0;
    let minDist = calculateDistance(currentPos, nearest.position);

    for (let i = 1; i < unvisited.length; i++) {
      const dist = calculateDistance(currentPos, unvisited[i].position);
      if (dist < minDist) {
        minDist = dist;
        nearest = unvisited[i];
        nearestIdx = i;
      }
    }

    route.push(nearest.position);
    binsOrdered.push(nearest);
    totalDistance += minDist;
    currentPos = nearest.position;
    unvisited.splice(nearestIdx, 1);
  }

  // Return to depot
  totalDistance += calculateDistance(currentPos, depot);
  route.push(depot);

  const stops = 'Depot → ' + bins.map(b => `Bin #${b.id}`).join(' → ') + ' → Depot';
  const etaMins = Math.ceil((totalDistance / 25) * 60); // Assume avg 25 km/h

  return {
    id: routeId,
    truck: truckId,
    driver: driverId,
    bins: bins.length,
    distance: totalDistance.toFixed(1) + ' km',
    eta: etaMins + ' min',
    priority: bins.some(b => b.risk === 'Critical') ? 'Critical' : bins.some(b => b.risk === 'High') ? 'High' : 'Medium',
    status: 'Ready',
    color: '#2563eb',
    points: route,
    stops: stops,
    binsOrdered: binsOrdered
  };
};

// Update bins near current location
export const updateBinsForLocation = (location) => {
  currentLocation = location;
  currentBins = generateBinsNearLocation(location, 0.03, 12);
};

export const getRoutes = () => delayed([...mockRoutes]);

export const getPriorityBins = () => delayed([...currentBins].sort((a, b) => b.fill - a.fill));

export const getDrivers = () => delayed(mockDrivers);

// Generate Google Maps URL with route waypoints
export const generateGMapsUrl = (routes) => {
  if (!routes || routes.length === 0) return null;
  
  // Get first route's bins
  const firstRoute = routes[0];
  const bins = firstRoute.binsOrdered || [];
  
  if (bins.length === 0) return null;
  
  // Start with origin (depot)
  const depot = [12.9716, 77.5946];
  const origin = `${depot[0]},${depot[1]}`;
  
  // Build waypoints: all bins in optimized order separated by pipe |
  const waypoints = bins.map(b => `${b.position[0]},${b.position[1]}`).join('|');
  const destination = `${bins[bins.length - 1].position[0]},${bins[bins.length - 1].position[1]}`;
  
  // Google Maps URL format: https://www.google.com/maps/dir/?api=1&origin=ORIGIN&destination=DESTINATION&waypoints=WAYPOINT1|WAYPOINT2
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
  
  return url;
};

// Optimize routes based on nearest neighbor algorithm
export const optimizeRoutes = (location) => {
  if (location && location !== currentLocation) {
    updateBinsForLocation(location);
  }

  const depot = currentLocation || [12.9716, 77.5946];
  const bins = currentBins;

  // Split bins into routes (3 routes max for demo)
  const criticalHighBins = bins.filter(b => ['Critical', 'High'].includes(b.risk)).sort((a, b) => b.fill - a.fill);
  const otherBins = bins.filter(b => !['Critical', 'High'].includes(b.risk)).sort((a, b) => b.fill - a.fill);

  const routes = [];

  // Route 1: Critical & High priority bins
  if (criticalHighBins.length > 0) {
    routes.push(nearestNeighborRoute(depot, criticalHighBins.slice(0, 6), 'TRK-102', 'Raj Kumar', 'R-01'));
  }

  // Route 2: Remaining bins
  const route2Bins = criticalHighBins.slice(6).concat(otherBins.slice(0, 4));
  if (route2Bins.length > 0) {
    routes.push(nearestNeighborRoute(depot, route2Bins, 'TRK-107', 'Arun Sharma', 'R-02'));
  }

  // Route 3: Final batch
  const route3Bins = otherBins.slice(4);
  if (route3Bins.length > 0) {
    routes.push(nearestNeighborRoute(depot, route3Bins, 'TRK-111', 'Kiran Rao', 'R-03'));
  }

  // Assign route IDs to bins
  routes.forEach(route => {
    route.binsOrdered.forEach(bin => {
      bin.routeId = route.id;
    });
  });

  return delayed(routes, 1500);
};

export const dispatchRoute = (routeId) => delayed({ routeId, status: 'Dispatched' }, 450);
export const assignTruck = (routeId, truckId) => delayed({ routeId, truckId }, 300);
