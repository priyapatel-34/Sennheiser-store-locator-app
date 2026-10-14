import { pool } from "../db/db.js";
import shopify from "../shopify.js";
import { capitalFor, countryMatchKeys } from "./countryMatch.js";

async function fetchShopCountry(session) {
  try {
    const shop = await shopify.api.rest.Shop.current({ session });
    if (!shop?.country_code && !shop?.country_name) {
      console.error("Shopify shop response did not include a country:", session.shop);
    }
    return {
      countryCode: shop?.country_code || null,
      countryName: shop?.country_name || null,
      latitude: shop?.latitude ?? null,
      longitude: shop?.longitude ?? null,
    };
  } catch (err) {
    console.error(
      "Failed to read Shopify shop country during installation:",
      session.shop,
      err?.message || err
    );
    return {};
  }
}

export async function resolveCountryId({
  countryCode,
  countryName,
  latitude,
  longitude,
}) {
  const { codes, names } = countryMatchKeys(countryCode, countryName);
  if (!codes.length && !names.length) {
    console.error("Cannot resolve country without a Shopify country code or name");
    return null;
  }

  const found = await pool.query(
    `
    SELECT id, code, name, capital_latitude, capital_longitude
    FROM countries
    WHERE UPPER(code) = ANY($1::text[])
       OR LOWER(name) = ANY($2::text[])
    ORDER BY id ASC
    `,
    [codes.length ? codes : [""], names.length ? names : [""]]
  );

  const capital = capitalFor(countryCode, countryName);
  const lat = capital?.lat ?? (latitude != null ? Number(latitude) : null);
  const lng = capital?.lng ?? (longitude != null ? Number(longitude) : null);
  const capitalName = capital?.name || null;

  let country = found.rows[0] || null;

  if (!country) {
    const code = (countryCode || "").trim().toUpperCase();
    if (!code) return null;

    const inserted = await pool.query(
      `
      INSERT INTO countries (
        name, code, capital_name, capital_latitude, capital_longitude
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (code)
      DO UPDATE SET
        capital_name = COALESCE(countries.capital_name, EXCLUDED.capital_name),
        capital_latitude = COALESCE(countries.capital_latitude, EXCLUDED.capital_latitude),
        capital_longitude = COALESCE(countries.capital_longitude, EXCLUDED.capital_longitude)
      RETURNING id
      `,
      [countryName || code, code, capitalName, lat, lng]
    );
    console.log("Created country for installed store:", code, inserted.rows[0]?.id);
    return inserted.rows[0]?.id || null;
  }

  if (
    (country.capital_latitude == null || country.capital_longitude == null) &&
    lat != null &&
    lng != null
  ) {
    await pool.query(
      `
      UPDATE countries
      SET capital_name = COALESCE(capital_name, $2),
          capital_latitude = COALESCE(capital_latitude, $3),
          capital_longitude = COALESCE(capital_longitude, $4)
      WHERE id = $1
      `,
      [country.id, capitalName, lat, lng]
    );
  }

  return country.id;
}

export async function registerInstalledStore(session) {
  if (!session?.shop) {
    console.error("Installation did not include a shop domain");
    return null;
  }

  const shopCountry = await fetchShopCountry(session);
  const countryId = await resolveCountryId(shopCountry);

  if (!countryId) {
    console.error(
      "Store will be saved without a country. Map center cannot be chosen yet:",
      session.shop
    );
  }

  const result = await pool.query(
    `
    INSERT INTO stores (shop_domain, country_id, is_installed)
    VALUES ($1, $2, true)
    ON CONFLICT (shop_domain)
    DO UPDATE SET
      is_installed = true,
      country_id = COALESCE(stores.country_id, EXCLUDED.country_id)
    RETURNING id, shop_domain, country_id, is_installed
    `,
    [session.shop, countryId]
  );

  const store = result.rows[0];
  console.log("Store installation saved:", store);

  if (store?.country_id) {
    await ensureCountryCoordinates(store.country_id);
  }

  return store;
}

export async function ensureCountryCoordinates(countryId) {
  if (!countryId) return;

  const result = await pool.query(
    `
    SELECT id, code, name, capital_latitude, capital_longitude
    FROM countries
    WHERE id = $1
    `,
    [countryId]
  );
  const country = result.rows[0];
  if (!country) return;
  if (country.capital_latitude != null && country.capital_longitude != null) return;

  const capital = capitalFor(country.code, country.name);
  if (!capital) {
    console.error(
      "No default map center for country:",
      country.id,
      country.code,
      country.name
    );
    return;
  }

  await pool.query(
    `
    UPDATE countries
    SET capital_name = COALESCE(capital_name, $2),
        capital_latitude = COALESCE(capital_latitude, $3),
        capital_longitude = COALESCE(capital_longitude, $4)
    WHERE id = $1
      AND (capital_latitude IS NULL OR capital_longitude IS NULL)
    `,
    [country.id, capital.name, capital.lat, capital.lng]
  );
  console.log("Filled missing map center for country:", country.code || country.name);
}

export async function ensureStoreRegistered(shopDomain) {
  if (!shopDomain) return null;

  const existing = await pool.query(
    `
    SELECT id, shop_domain, country_id, is_installed
    FROM stores
    WHERE shop_domain = $1
    `,
    [shopDomain]
  );
  const row = existing.rows[0];

  if (row?.country_id && row.is_installed) {
    await ensureCountryCoordinates(row.country_id);
    return row;
  }

  const sessionId = shopify.api.session.getOfflineId(shopDomain);
  const session = await shopify.config.sessionStorage.loadSession(sessionId);
  if (!session) {
    console.error(
      "No offline Shopify session available to register store:",
      shopDomain
    );
    if (row?.country_id) await ensureCountryCoordinates(row.country_id);
    return row || null;
  }

  return registerInstalledStore(session);
}
