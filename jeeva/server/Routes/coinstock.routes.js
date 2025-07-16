const express = require("express");
const router = express.Router();
const stockController = require("../Controllers/coinstock.controller");

router.post("/create", stockController.createStock);
router.get("/", stockController.getAllStocks);
router.put("/:id", stockController.updateStock);
router.delete("/:id", stockController.deleteStock);
router.post("/reduce", stockController.reduceStock);
router.post("/add", stockController.incrementStock);
router.get("/logs", stockController.getAllLogs);

module.exports = router;
