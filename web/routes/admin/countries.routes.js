import express from "express";
import { getCountries } from "../../controller/admin/countries.controller.js";

const router = express.Router();

router.get("/", getCountries);

export default router;
