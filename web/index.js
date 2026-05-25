// @ts-check
import { join } from "path";
import cors from "cors";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import { pool } from "./db/db.js";
import shopify from "./shopify.js";
import { initDb } from "./db/initDb.js";
import PrivacyWebhookHandlers from "./privacy.js";
import retailersRoutes from "./routes/admin/retailers.routes.js";
import categoriesRoutes from "./routes/admin/categories.routes.js";
import settingsRoutes from "./routes/admin/settings.routes.js";
import countriesRoutes from "./routes/admin/countries.routes.js";
import storeRetailersRoutes from "./routes/storefront/retailer.routes.js";
import storeCategoriesRoutes from "./routes/storefront/categories.routes.js";
import storeSettingsRoutes from "./routes/storefront/settings.routes.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { importRetailersCSV } from "./controller/admin/retailers.controller.js";

const app = express();
app.set("trust proxy", 1);
await initDb();

const PORT = parseInt(process.env.PORT || "3000", 10);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATIC_PATH =
    process.env.NODE_ENV === "production"
      ? join(__dirname, "frontend", "dist")
      : join(__dirname, "frontend");

      // Auth
app.get(shopify.config.auth.path, shopify.auth.begin());

app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

// Webhooks
app.post(
  "/api/webhooks",
  shopify.processWebhooks({
    webhookHandlers: PrivacyWebhookHandlers,
  })
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ENSURE INSTALLED FIRST
app.use("/app/*", shopify.ensureInstalledOnShop());

// Authenticated APIs
app.use(
  "/app/retailers",
  shopify.validateAuthenticatedSession(),
  retailersRoutes
);

app.use(
  "/app/categories",
  shopify.validateAuthenticatedSession(),
  categoriesRoutes
);

app.use(
  "/app/settings",
  shopify.validateAuthenticatedSession(),
  settingsRoutes
);

app.use(
  "/app/countries",
  shopify.validateAuthenticatedSession(),
  countriesRoutes
);

app.use(
  "/app/import",
  shopify.validateAuthenticatedSession(),
  importRetailersCSV
);

// Public routes
app.use("/retailers", storeRetailersRoutes);
app.use("/categories", storeCategoriesRoutes);
app.use("/settings", storeSettingsRoutes);

// Static
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

// Catch all
app.use("/*", (req, res) => {
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace(
          "%VITE_SHOPIFY_API_KEY%",
          process.env.SHOPIFY_API_KEY || ""
        )
    );
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// // @ts-check
// import { join } from "path";
// import cors from "cors";
// import { readFileSync } from "fs";
// import express from "express";
// import serveStatic from "serve-static";
// import { pool } from "./db/db.js";
// import shopify from "./shopify.js";
// import { initDb } from "./db/initDb.js";
// import PrivacyWebhookHandlers from "./privacy.js";
// import retailersRoutes from "./routes/admin/retailers.routes.js";
// import categoriesRoutes from "./routes/admin/categories.routes.js";
// import settingsRoutes from "./routes/admin/settings.routes.js";
// import countriesRoutes from "./routes/admin/countries.routes.js";
// import storeRetailersRoutes from "./routes/storefront/retailer.routes.js";
// import storeCategoriesRoutes from "./routes/storefront/categories.routes.js";
// import storeSettingsRoutes from "./routes/storefront/settings.routes.js";

// const PORT = parseInt(process.env.PORT || "3000", 10);

// const STATIC_PATH =
//   process.env.NODE_ENV === "production"
//     ? join(process.cwd(), "web/frontend/dist")
//     : join(process.cwd(), "web/frontend");

// const app = express();
// app.use(cors());
// await initDb();
// app.use(express.json());

// app.get(shopify.config.auth.path, shopify.auth.begin());
// app.get(
//   shopify.config.auth.callbackPath,
//   shopify.auth.callback(),
//   async (req, res) => {
//     try {
//       console.log("CALLBACK HIT");

//       const session = res.locals.shopify.session;

//       console.log("SESSION:", session);

//       if (!session) {
//         console.log("NO SESSION");
//         return res.status(500).send("No session found");
//       }

//       console.log("INSERTING STORE");

//       await pool.query(
//         `
//         INSERT INTO stores (
//           shop_domain,
//           access_token,
//           is_installed
//         )
//         VALUES ($1, $2, true)
//         ON CONFLICT (shop_domain)
//         DO UPDATE SET
//           access_token = EXCLUDED.access_token,
//           is_installed = true
//         `,
//         [session.shop, session.accessToken]
//       );

//       console.log("STORE SAVED");

//       return shopify.redirectToShopifyOrAppRoot();

//     } catch (err) {
//       console.error("AUTH ERROR:", err);
//       res.status(500).send("Auth failed");
//     }
//   }
// );

// /* ---------------- WEBHOOKS ---------------- */

// app.post(
//   shopify.config.webhooks.path,
//   shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use("/app/retailers", shopify.validateAuthenticatedSession(), retailersRoutes);
// app.use("/app/categories", shopify.validateAuthenticatedSession(), categoriesRoutes);
// app.use("/app/settings", shopify.validateAuthenticatedSession(), settingsRoutes);
// app.use("/app/countries", shopify.validateAuthenticatedSession(), countriesRoutes);

// app.use("/retailers", storeRetailersRoutes);
// app.use("/categories", storeCategoriesRoutes);
// app.use("/settings", storeSettingsRoutes);
// /* ---------------- AUTH MIDDLEWARE ---------------- */

// app.use("/api/*", shopify.validateAuthenticatedSession());

// /* ---------------- SAMPLE API ---------------- */

// app.get("/api/products/count", async (_req, res) => {
//   const client = new shopify.api.clients.Graphql({
//     session: res.locals.shopify.session,
//   });

//   const data = await client.request(`
//     query {
//       productsCount {
//         count
//       }
//     }
//   `);

//   res.json({ count: data.data.productsCount.count });
// });

// /* ---------------- STATIC ---------------- */

// app.use(shopify.cspHeaders());

// app.use(serveStatic(STATIC_PATH, { index: false }));

// app.use("/*", shopify.ensureInstalledOnShop(), (req, res) => {
//   return res
//     .status(200)
//     .set("Content-Type", "text/html")
//     .send(
//       readFileSync(join(STATIC_PATH, "index.html"))
//         .toString()
//         .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
//     );
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });