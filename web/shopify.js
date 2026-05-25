import dotenv from "dotenv";
dotenv.config();
import { pool } from "./db/db.js";
import { BillingInterval } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import { PostgreSQLSessionStorage } from "@shopify/shopify-app-session-storage-postgresql";

const dbUser =
  process.env.DATABASE_USER ||
  "adminuser@dechb-storelocator-psql-prd";
const dbPassword = process.env.DATABASE_PASSWORD;
const dbHost =
  process.env.DATABASE_HOST ||
  "dechb-storelocator-psql-prd.postgres.database.azure.com";
const dbPort = process.env.DATABASE_PORT || "5432";

const dbName =
  process.env.DATABASE_NAME || "retailer_locator";

const DATABASE_URL =
  `postgres://${dbUser}:${encodeURIComponent(
    dbPassword
  )}@${dbHost}:${dbPort}/${dbName}?sslmode=require`;

const sessionStorage =
  new PostgreSQLSessionStorage(
    DATABASE_URL,
    {
      connectionOptions: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    }
  );

const billingConfig = {
  "My Shopify One-Time Charge": {
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

const shopify = shopifyApp({
  api: {
    restResources,
    apiVersion: "2024-10",

    apiKey: process.env.SHOPIFY_API_KEY,

    apiSecretKey:
      process.env.SHOPIFY_API_SECRET,

    hostName: (
      process.env.HOST || ""
    ).replace(/^https?:\/\//, ""),

    scopes: (
      process.env.SCOPES || ""
    ).split(","),

    isEmbeddedApp: true,

    future: {
      lineItemBilling: true,
      customerAddressDefaultFix: true,
      unstable_managedPricingSupport: true,
    },
  },

  auth: {
    path: "/api/auth",

    callbackPath: "/api/auth/callback",

    afterAuth: async ({ session }) => {
      try {
        console.log("AFTER AUTH HIT");

        console.log(
          "SHOP:",
          session.shop
        );

        const result = await pool.query(
          `
          INSERT INTO stores (
            shop_domain,
            is_installed
          )
          VALUES ($1, true)

          ON CONFLICT (shop_domain)

          DO UPDATE SET
            is_installed = true

          RETURNING *;
          `,
          [session.shop]
        );

        console.log(
          "STORE SAVED:",
          result.rows[0]
        );
      } catch (err) {
        console.error(
          "AFTER AUTH DB ERROR:",
          err
        );
      }
    },
  },

  webhooks: {
    path: "/api/webhooks",
  },

  billing: billingConfig,

  sessionStorage,
});

export default shopify;
// import dotenv from "dotenv";
// dotenv.config();

// import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
// import { shopifyApp } from "@shopify/shopify-app-express";
// import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
// import { PostgreSQLSessionStorage } from "@shopify/shopify-app-session-storage-postgresql";

// // PostgreSQL Session Storage
// const sessionStorage = new PostgreSQLSessionStorage(
//   process.env.DATABASE_URL
// );

// // Environment Variable Checks
// console.log("ENV CHECK:");
// console.log("API KEY:", process.env.SHOPIFY_API_KEY);
// console.log("API SECRET:", process.env.SHOPIFY_API_SECRET);
// console.log("PORT:", process.env.PORT);
// console.log("HOST:", process.env.HOST);
// console.log("SCOPES:", process.env.SCOPES);
// console.log("DATABASE_URL:", process.env.DATABASE_URL);

// // Billing Configuration
// const billingConfig = {
//   "My Shopify One-Time Charge": {
//     amount: 5.0,
//     currencyCode: "USD",
//     interval: BillingInterval.OneTime,
//   },
// };

// // Shopify App Configuration
// const shopify = shopifyApp({
//   api: {
//     restResources,
//     apiVersion: LATEST_API_VERSION,

//     apiKey: process.env.SHOPIFY_API_KEY,
//     apiSecretKey: process.env.SHOPIFY_API_SECRET,

//     hostName: (process.env.HOST || "").replace(
//       /^https?:\/\//,
//       ""
//     ),

//     hostScheme: "https",

//     isEmbeddedApp: true,

//     future: {
//       customerAddressDefaultFix: true,
//       lineItemBilling: true,
//       unstable_managedPricingSupport: true,
//     },

//     // Enable billing if needed
//     billing: undefined,
//     // billing: billingConfig,
//   },

//   auth: {
//     path: "/api/auth",
//     callbackPath: "/api/auth/callback",
//   },

//   webhooks: {
//     path: "/api/webhooks",
//   },

//   sessionStorage,
// });

// export default shopify;