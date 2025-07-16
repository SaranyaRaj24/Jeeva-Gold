import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Advance.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";

const Advancereport = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [totalPurity, setTotalPurity] = useState(0);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${BACKEND_SERVER_URL}/api/customers`);
        setCustomers(res.data);
      } catch (error) {
        console.error("Failed to fetch customers", error);
      }
    };

    const fetchTransactions = async () => {
      try {
        const res = await axios.get(`${BACKEND_SERVER_URL}/api/transactions/all`);
        setTransactions(res.data);
        
        // Calculate total purity
        const puritySum = res.data.reduce((sum, txn) => {
          if (txn.purity) {
            return sum + parseFloat(txn.purity);
          } else if (txn.type === "Cash" && txn.value && txn.goldRate) {
            const calculatedPurity = txn.value / txn.goldRate;
            return sum + calculatedPurity;
          }
          return sum;
        }, 0);
        setTotalPurity(puritySum);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      }
    };

    fetchCustomers();
    fetchTransactions();
  }, []);

  return (
    <div className="advance-report-container">
      <h2>Advance Payments Report</h2>
      <br></br>

      {transactions.length > 0 ? (
        <table className="advance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Value</th>
              <th>Purity (grams)</th>
              <th>Touch</th>
              <th>Gold Rate</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td>{new Date(txn.date).toLocaleDateString("en-IN")}</td>
                <td>{txn.customer?.name || "-"}</td>
                <td>{txn.type}</td>
                <td>
                  {txn.type === "Cash"
                    ? `₹${txn.value.toFixed(2)}`
                    : `${txn.value.toFixed(3)}g`}
                </td>
                <td>{txn.purity?.toFixed(3) || "-"}</td>
                <td>{txn.touch ? `${txn.touch}%` : "-"}</td>
                <td>
                  {txn.goldRate && txn.type === "Cash"
                    ? `₹${txn.goldRate.toFixed(2)}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan="4" className="total-label">
                Total Purity:
              </td>
              <td className="total-value">{totalPurity.toFixed(3)}g</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="no-data">
          No advance payments found.
        </p>
      )}
    </div>
  );
};

export default Advancereport;