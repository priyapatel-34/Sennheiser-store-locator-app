import { BillingInterval } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
// import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import { PostgreSQLSessionStorage } from "@shopify/shopify-app-session-storage-postgresql";
// const DB_PATH = `${process.cwd()}/database.sqlite`;
const sessionStorage = new PostgreSQLSessionStorage(
  process.env.DATABASE_HOST
);
console.log("ENV CHECK:");
console.log("API KEY:", process.env.SHOPIFY_API_KEY);
console.log("API SECRET:", process.env.SHOPIFY_API_SECRET);
console.log("port:", process.env.PORT);

console.log("HOST:", process.env.HOST);
console.log("SCOPES:", process.env.SCOPES);
console.log("DATABASE_HOST:", process.env.DATABASE_HOST);

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

const shopify = shopifyApp({
  api: {
    restResources,
    apiVersion: "2026-07",
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    hostName: process.env.HOST.replace(/^https?:\/\//, ""),
    hostScheme: "https",
    isEmbeddedApp: true,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: undefined,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage
});

export default shopify;
