import express from "express";
import { getRetailers } from "../../controller/storefront/storeRetailer.controller.js";
const router = express.Router();
 
router.get("/", getRetailers);
 
export default router;
 