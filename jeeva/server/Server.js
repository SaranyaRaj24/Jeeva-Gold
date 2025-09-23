const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./Routes/auth.routes");
const userRoutes = require("./Routes/user.routes");
const customerRoutes = require("./Routes/customer.routes");
const goldsmithRoutes = require("./Routes/goldsmith.routes");
const masterItemRoutes = require("./Routes/masteritem.routes");
const stockRoutes = require("./Routes/coinstock.routes");
const jobCardRoutes = require("./Routes/jobcard.routes");
const billRoutes = require("./Routes/bill.routes");
const jewelStockRoutes = require("./Routes/jewelstock.routes");
const transactionRoutes = require("./Routes/transaction.routes");
const entryRoutes = require("./Routes/cashgold.routes");
const expenseRoutes = require("./Routes/expense.routes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/master-items", masterItemRoutes);
app.use("/api/v1/stocks", stockRoutes);
app.use("/api/goldsmith", goldsmithRoutes);
app.use("/api/job-cards", jobCardRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/jewel-stock", jewelStockRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/expenses", expenseRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
