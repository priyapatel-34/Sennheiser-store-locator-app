export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function normalizePostalCode(value) {
  return String(value || "").replace(/[\s-]/g, "");
}

export function isPostalCodeTerm(term) {
  return /^\d{4,10}$/.test(normalizePostalCode(term));
}

export function resolveSearchType(search, searchType, countryName) {
  if (searchType) return searchType;
  if (!search) return "general";
  if (isPostalCodeTerm(search)) return "postal_code";
  if (
    countryName &&
    search.trim().toLowerCase() === countryName.trim().toLowerCase()
  ) {
    return "country";
  }
  return "general";
}

export function shouldApplyTextSearch(cleanSearch) {
  return Boolean(cleanSearch && cleanSearch.trim());
}

export function shouldSkipTextSearchForRadiusGeo(useGeoSearch, radiusKm) {
  return (
    useGeoSearch &&
    radiusKm !== null &&
    !Number.isNaN(radiusKm)
  );
}

export function applyGeoFilter(retailers, searchLat, searchLng, radiusKm) {
  const withoutCoords = retailers.filter(
    (retailer) => !retailer.latitude || !retailer.longitude
  );

  let withCoords = retailers
    .filter((retailer) => retailer.latitude && retailer.longitude)
    .map((retailer) => {
      const distance = calculateDistanceKm(
        searchLat,
        searchLng,
        parseFloat(retailer.latitude),
        parseFloat(retailer.longitude)
      );

      return {
        ...retailer,
        distance: Number(distance.toFixed(2)),
      };
    });

  if (radiusKm !== null && !Number.isNaN(radiusKm)) {
    withCoords = withCoords.filter(
      (retailer) => retailer.distance <= radiusKm
    );
    withCoords.sort((a, b) => a.distance - b.distance);
    return withCoords;
  }

  withCoords.sort((a, b) => a.distance - b.distance);

  return [
    ...withCoords,
    ...withoutCoords.map((retailer) => ({ ...retailer, distance: null })),
  ];
}