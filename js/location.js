// Location module
const Location = (() => {
  // MultiFit Pradhikaran, Opp. Akurdi Railway Station, Pune
  const MULTIFIT_LAT = 18.6492;
  const MULTIFIT_LNG = 73.7689;
  const MAX_DISTANCE_KM = 3;

  let coords = null;

  function request() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation not supported'));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          resolve(coords);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // Haversine formula to calculate distance between two lat/lng points in km
  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function isEligible() {
    if (!coords) return false;
    const dist = distanceKm(coords.lat, coords.lng, MULTIFIT_LAT, MULTIFIT_LNG);
    return { eligible: dist <= MAX_DISTANCE_KM, distance: dist.toFixed(1) };
  }

  function getCoords() {
    return coords;
  }

  return { request, getCoords, isEligible };
})();
