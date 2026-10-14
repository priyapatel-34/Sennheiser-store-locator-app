import { pool } from "./db.js";
import { CAPITAL_BACKFILL } from "../lib/countryMatch.js";

export async function initDb() {
  try {
    console.log("🔧 Initializing PostgreSQL DB...");

    // COUNTRIES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS countries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        capital_name VARCHAR(255),
        capital_latitude NUMERIC(10,7),
        capital_longitude NUMERIC(10,7)
      );
    `);

    // STORES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        shop_domain VARCHAR(255) UNIQUE NOT NULL,
        country_id INT REFERENCES countries(id),
        is_installed BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ADMIN SETTINGS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        store_id INT UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
        filter_enabled BOOLEAN DEFAULT TRUE,
        show_global_retailers BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // CATEGORIES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        store_id INT REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // RETAILERS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retailers (
        id SERIAL PRIMARY KEY,
        store_id INT REFERENCES stores(id) ON DELETE CASCADE,
        country_id INT REFERENCES countries(id),
        name VARCHAR(255) NOT NULL,
        retailer_type VARCHAR(20)
          CHECK (
            retailer_type IN (
              'offline',
              'online',
              'hybrid'
            )
          )
          DEFAULT 'offline',

        status VARCHAR(20)
          CHECK (
            status IN (
              'active',
              'inactive'
            )
          )
          DEFAULT 'active',

        address_line1 TEXT,
        address_line2 TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        latitude NUMERIC(10,7),
        longitude NUMERIC(10,7),
        phone VARCHAR(50),
        email VARCHAR(255),
        website_url TEXT,
        google_maps_link TEXT,
        opening_hours TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // RETAILER CATEGORIES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retailer_categories (
        id SERIAL PRIMARY KEY,
        retailer_id INT REFERENCES retailers(id) ON DELETE CASCADE,
        category_id INT REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE (retailer_id, category_id)
      );
    `);

    // INDEXES (IMPORTANT FOR PERFORMANCE)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_retailers_store
      ON retailers(store_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_retailers_country
      ON retailers(country_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_store
      ON categories(store_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_store_country
      ON stores(country_id);
    `);

    try {
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS stores_shop_domain_key
        ON stores (shop_domain);
      `);
    } catch (err) {
      console.error("Could not ensure unique shop_domain index:", err.message);
    }

    // DEFAULT COUNTRIES
    await pool.query(`
      INSERT INTO countries (
        name,
        code,
        capital_name,
        capital_latitude,
        capital_longitude
      )
      VALUES

      (
        'US',
        'US',
        'Washington, D.C',
        38.8898000,
        -77.0091000
      ),

      (
        'Japan',
        'JP',
        'Tokyo',
        35.6762000,
        139.6503000
      ),

      (
        'Germany',
        'DE',
        'Berlin',
        52.5200000,
        13.4050000
      ),

      (
        'India',
        'IN',
        'New Delhi',
        28.6139000,
        77.2090000
      )

      ON CONFLICT (code)
      DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO countries (
        name, code, capital_name, capital_latitude, capital_longitude
      )
      SELECT 'United Kingdom', 'GB', 'London', 51.5074000, -0.1278000
      WHERE NOT EXISTS (
        SELECT 1 FROM countries
        WHERE UPPER(code) IN ('GB', 'UK')
           OR LOWER(name) IN ('united kingdom', 'uk', 'great britain')
      )
      ON CONFLICT (code) DO NOTHING;
    `);

    for (const entry of CAPITAL_BACKFILL) {
      await pool.query(
        `
        UPDATE countries
        SET capital_name = COALESCE(capital_name, $3),
            capital_latitude = COALESCE(capital_latitude, $4),
            capital_longitude = COALESCE(capital_longitude, $5)
        WHERE (capital_latitude IS NULL OR capital_longitude IS NULL)
          AND (
            UPPER(code) = ANY($1::text[])
            OR LOWER(name) = ANY($2::text[])
          )
        `,
        [
          entry.codes,
          entry.names,
          entry.capital.name,
          entry.capital.lat,
          entry.capital.lng,
        ]
      );
    }

    console.log("✅ DB Initialized Successfully");

  } catch (err) {
    console.error("❌ DB Init Error:", err);
  }
}

// import { pool } from "./db.js";

// export async function initDb() {
//   try {
//     console.log("🔧 Initializing PostgreSQL DB...");

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS stores (
//         id SERIAL PRIMARY KEY,
//         shop_domain TEXT UNIQUE NOT NULL,
//         access_token TEXT NOT NULL,
//         is_installed BOOLEAN DEFAULT TRUE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS countries (
//         id SERIAL PRIMARY KEY,
//         name TEXT NOT NULL,
//         code VARCHAR(10) UNIQUE NOT NULL
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS categories (
//         id SERIAL PRIMARY KEY,
//         store_id INT REFERENCES stores(id) ON DELETE CASCADE,
//         name TEXT NOT NULL,
//         is_active BOOLEAN DEFAULT TRUE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS retailers (
//         id SERIAL PRIMARY KEY,
//         store_id INT REFERENCES stores(id) ON DELETE CASCADE,
//         country_id INT REFERENCES countries(id),

//         name TEXT NOT NULL,
//         retailer_type VARCHAR(20) 
//           CHECK (retailer_type IN ('offline','online','hybrid')) DEFAULT 'offline',

//         status VARCHAR(20) DEFAULT 'active',

//         address_line1 TEXT,
//         address_line2 TEXT,
//         city TEXT,
//         state TEXT,
//         postal_code TEXT,

//         latitude DECIMAL,
//         longitude DECIMAL,

//         phone TEXT,
//         email TEXT,
//         website_url TEXT,
//         google_maps_link TEXT,

//         opening_hours TEXT,
//         notes TEXT,

//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS retailer_categories (
//         id SERIAL PRIMARY KEY,
//         retailer_id INT REFERENCES retailers(id) ON DELETE CASCADE,
//         category_id INT REFERENCES categories(id) ON DELETE CASCADE,
//         UNIQUE (retailer_id, category_id)
//       );
//     `);

//     // ⚡ INDEXES (VERY IMPORTANT FOR 10k+)
//     await pool.query(`CREATE INDEX IF NOT EXISTS idx_retailers_store ON retailers(store_id);`);
//     await pool.query(`CREATE INDEX IF NOT EXISTS idx_retailers_country ON retailers(country_id);`);
//     await pool.query(`CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);`);

//     console.log("✅ DB Initialized Successfully");

//   } catch (err) {
//     console.error("❌ DB Init Error:", err);
//   }
// }