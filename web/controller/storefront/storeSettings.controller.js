import { pool } from "../../db/db.js";

export async function getFilters(req, res) {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({
        success: false,
        error: "shop is required",
      });
    }

    const storeResult = await pool.query(
      `SELECT id FROM stores WHERE shop_domain = $1 AND is_installed = true`,
      [shop]
    );

    if (!storeResult.rows.length) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    const storeData = storeResult.rows[0];
    const store_id = storeData.id;

    const result = await pool.query(
      `SELECT
         COALESCE(a.filter_enabled, true) AS filter_enabled,
         COALESCE(a.show_global_retailers, false) AS show_global_retailers,
         c.code AS country_code,
         c.name AS country_name,
         c.capital_latitude,
         c.capital_longitude,
         c.capital_name
       FROM stores s
       LEFT JOIN admin_settings a
         ON a.store_id = s.id
       LEFT JOIN countries c 
         ON s.country_id = c.id
       WHERE s.id = $1
       LIMIT 1`,
      [store_id]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}