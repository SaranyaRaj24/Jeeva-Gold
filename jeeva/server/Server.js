const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./Routes/auth.routes");
const customerRoutes = require("./Routes/customer.routes");
const masterItemRoutes = require("./Routes/masteritem.routes");
const stockRoutes = require("./Routes/coinstock.routes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/master-items", masterItemRoutes);
app.use("/api/v1/stocks", stockRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
