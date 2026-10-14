const CAPITAL_BACKFILL = [
  {
    codes: ["GB", "UK"],
    names: ["united kingdom", "uk", "great britain", "britain"],
    capital: { name: "London", lat: 51.5074, lng: -0.1278 },
  },
  {
    codes: ["IN"],
    names: ["india"],
    capital: { name: "New Delhi", lat: 28.6139, lng: 77.209 },
  },
  {
    codes: ["US", "USA"],
    names: ["united states", "united states of america", "us", "usa"],
    capital: { name: "Washington, D.C", lat: 38.8898, lng: -77.0091 },
  },
  {
    codes: ["DE"],
    names: ["germany"],
    capital: { name: "Berlin", lat: 52.52, lng: 13.405 },
  },
  {
    codes: ["JP"],
    names: ["japan"],
    capital: { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  },
];

const CODE_ALIASES = {
  GB: ["GB", "UK"],
  UK: ["GB", "UK"],
  US: ["US", "USA"],
  USA: ["US", "USA"],
};

export function countryMatchKeys(countryCode, countryName) {
  const code = (countryCode || "").trim().toUpperCase();
  const name = (countryName || "").trim().toLowerCase();
  const codes = new Set(CODE_ALIASES[code] || (code ? [code] : []));
  const names = new Set(name ? [name] : []);

  const match = CAPITAL_BACKFILL.find(
    (entry) =>
      entry.codes.includes(code) || (name && entry.names.includes(name))
  );
  if (match) {
    match.codes.forEach((value) => codes.add(value));
    match.names.forEach((value) => names.add(value));
  }

  return {
    codes: [...codes],
    names: [...names],
  };
}

export function capitalFor(countryCode, countryName) {
  const code = (countryCode || "").trim().toUpperCase();
  const name = (countryName || "").trim().toLowerCase();
  const match = CAPITAL_BACKFILL.find(
    (entry) => entry.codes.includes(code) || entry.names.includes(name)
  );
  return match?.capital || null;
}

export { CAPITAL_BACKFILL };
