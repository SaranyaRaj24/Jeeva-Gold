const express = require("express");
const jobCardController = require("../Controllers/jobcard.controller");
const router = express.Router();

router.post("/", jobCardController.createJobCard);

router.patch("/items/:itemId", jobCardController.updateJobCardItem);

router.get("/:id", jobCardController.getJobCardById);

module.exports = router;
