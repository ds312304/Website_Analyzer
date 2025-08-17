import express from 'express';
import { analyzeWebsite, deleteWebsite, getWebsites, updateWebsite } from './controller/websiteController.js';
const router = express.Router();
router.post("/analyze", analyzeWebsite);
router.get("/websites/", getWebsites);
router.put("/websites/:id", updateWebsite);
router.delete("/websites/:id", deleteWebsite);

export default router;