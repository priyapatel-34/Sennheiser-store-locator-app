import express from "express";
import {getFilters} from "../../controller/storefront/storeSettings.controller.js";
const router = express.Router();
 
router.get("/", getFilters);
 
export default router;
 