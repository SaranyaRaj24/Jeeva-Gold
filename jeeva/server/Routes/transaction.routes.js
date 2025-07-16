const express = require("express");
const router = express.Router();
const transactionController = require("../Controllers/transaction.controller");

router.post("/", transactionController.createTransaction);
router.put("/update/:id", transactionController.updateTransaction);
router.get("/all", transactionController.getAllTransactionsForAllCustomers);
router.get("/:customerId", transactionController.getAllTransactions);
router.delete("/delete/:id", transactionController.deleteTransaction);

module.exports = router;
