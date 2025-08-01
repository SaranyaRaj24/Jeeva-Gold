
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Customertrans.css";
import { useSearchParams } from "react-router-dom";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { formatNumber } from "../../utils/formatNumber";

const Customertrans = () => {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get("id");
  const customerName = searchParams.get("name");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState("");
  const [goldRate, setGoldRate] = useState("");
  const [editTransactionId, setEditTransactionId] = useState(null);

  const [newTransaction, setNewTransaction] = useState({
    date: "",
    value: "",
    type: "Select",
    cashValue: "",
    goldValue: "",
    touch: "",
    purity: "",
  });

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setNewTransaction((prev) => ({ ...prev, date: today }));
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (customerId) {
          const response = await axios.get(
            `${BACKEND_SERVER_URL}/api/transactions/${customerId}`
          );
          setTransactions(response.data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions");
      }
    };

    fetchTransactions();
  }, [customerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedTransaction = { ...newTransaction, [name]: value };

    if (name === "cashValue" && updatedTransaction.type === "Cash") {
      updatedTransaction.value = value;
      if (goldRate) {
        const cash = parseFloat(value);
        const rate = parseFloat(goldRate);
        if (!isNaN(cash) && !isNaN(rate) && rate > 0) {
          updatedTransaction.purity = (cash / rate);
        }
      }
    } else if (name === "goldValue" && updatedTransaction.type === "Gold") {
      updatedTransaction.value = value;
      const touch = parseFloat(updatedTransaction.touch);
      const gold = parseFloat(value);
      if (!isNaN(gold) && !isNaN(touch)) {
        updatedTransaction.purity = ((gold * touch) / 100);
      }
    } else if (name === "touch" && updatedTransaction.type === "Gold") {
      const gold = parseFloat(updatedTransaction.goldValue);
      const touch = parseFloat(value);
      if (!isNaN(gold) && !isNaN(touch)) {
        updatedTransaction.purity = ((gold * touch) / 100);
      }
    }

    setNewTransaction(updatedTransaction);
  };

  const resetForm = () => {
    setNewTransaction({
      date: new Date().toISOString().split("T")[0],
      value: "",
      type: "Select",
      cashValue: "",
      goldValue: "",
      touch: "",
      purity: "",
    });
    setError("");
    setGoldRate("");
    setEditTransactionId(null);
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (!newTransaction.date || newTransaction.type === "Select") {
        throw new Error("Date and transaction type are required");
      }

      if (!customerId) {
        throw new Error("Customer ID is missing");
      }

      const transactionData = {
        date: newTransaction.date,
        type: newTransaction.type,
        value:
          newTransaction.type === "Cash"
            ? parseFloat(newTransaction.cashValue)
            : parseFloat(newTransaction.goldValue),
        purity: parseFloat(newTransaction.purity),
        customerId: parseInt(customerId),
        goldRate: newTransaction.type === "Cash" ? parseFloat(goldRate) : null,
        touch:
          newTransaction.type === "Gold"
            ? parseFloat(newTransaction.touch)
            : null,
      };

      if (editTransactionId) {
        const res = await axios.put(
          `${BACKEND_SERVER_URL}/api/transactions/update/${editTransactionId}`,
          transactionData
        );
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === editTransactionId ? res.data.transaction : t
          )
        );
        toast.success("Transaction updated successfully!");
      } else {
        const response = await axios.post(
          `${BACKEND_SERVER_URL}/api/transactions`,
          transactionData
        );
        setTransactions([...transactions, response.data]);
        toast.success("Transaction added successfully!");
      }

      resetForm();
      setShowPopup(false);
    } catch (error) {
      console.error("Error adding/updating transaction:", error);
      toast.error(error.message || "Error saving transaction");
    }
  };

  const handleEdit = (transaction) => {
    setNewTransaction({
      date: transaction.date.split("T")[0],
      type: transaction.type,
      cashValue: transaction.type === "Cash" ? transaction.value : "",
      goldValue: transaction.type === "Gold" ? transaction.value : "",
      touch: transaction.touch || "",
      purity: transaction.purity || "",
      value: transaction.value,
    });
    setGoldRate(transaction.goldRate || "");
    setEditTransactionId(transaction.id);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(`${BACKEND_SERVER_URL}/api/transactions/delete/${id}`);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return (!from || transactionDate >= from) && (!to || transactionDate <= to);
  });

  const totals = filteredTransactions.reduce(
    (acc, transaction) => {
      acc.totalPurity += parseFloat(transaction.purity) || 0;
      return acc;
    },
    { totalPurity: 0 }
  );

  return (
    <div className="customer-transactions">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>
        Customer Transactions{" "}
        {customerName && `for ${decodeURIComponent(customerName)}`}
      </h2>
      <br />
      {error && <div className="error-message">{error}</div>}

      <div className="filters">
        <label>
          From Date:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          To Date:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>

      <button onClick={() => setShowPopup(true)} className="add-btn">
        Add Transaction
      </button>

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <span
              className="popup-close"
              onClick={() => {
                resetForm();
                setShowPopup(false);
              }}
            >
              ×
            </span>

            <h3>
              {editTransactionId ? "Edit Transaction" : "Add Transaction"}
            </h3>
            <form onSubmit={addTransaction}>
              <label>
                Date:
                <input
                  type="date"
                  name="date"
                  value={newTransaction.date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Type:
                <select
                  name="type"
                  value={newTransaction.type}
                  onChange={handleChange}
                  required
                >
                  <option value="Select">Select</option>
                  <option value="Cash">Cash</option>
                  <option value="Gold">Gold</option>
                </select>
              </label>

              {newTransaction.type === "Cash" && (
                <>
                  <label>
                    Cash Amount (₹):
                    <input
                      type="number"
                      name="cashValue"
                      value={newTransaction.cashValue}
                      onChange={handleChange}
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    Gold Rate (₹/gram):
                    <input
                      type="number"
                      value={goldRate}
                      onChange={(e) => {
                        setGoldRate(e.target.value);
                        if (newTransaction.cashValue) {
                          const cash = parseFloat(newTransaction.cashValue);
                          const rate = parseFloat(e.target.value);
                          if (!isNaN(cash) && !isNaN(rate) && rate > 0) {
                            const updatedTransaction = { ...newTransaction };
                            updatedTransaction.purity = (cash / rate);
                            setNewTransaction(updatedTransaction);
                          }
                        }
                      }}
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    Purity (grams):
                    <input
                      type="number"
                      name="purity"
                      value={newTransaction.purity || ""}
                      readOnly
                    />
                  </label>
                </>
              )}

              {newTransaction.type === "Gold" && (
                <>
                  <label>
                    Gold Value (grams):
                    <input
                      type="number"
                      name="goldValue"
                      value={newTransaction.goldValue}
                      onChange={handleChange}
                      step="0.001"
                      required
                    />
                  </label>
                  <label>
                    Touch (%):
                    <input
                      type="number"
                      name="touch"
                      value={newTransaction.touch}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </label>
                  <label>
                    Purity (grams):
                    <input
                      type="number"
                      name="purity"
                      value={newTransaction.purity}
                      readOnly
                    />
                  </label>
                </>
              )}

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    resetForm();
                    setShowPopup(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Value</th>
            <th>Gold Rate</th>
            <th>Purity (grams)</th>
            <th>Touch</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{new Date(transaction.date).toLocaleDateString()}</td>
              <td>{transaction.type}</td>
              <td>
                {transaction.type === "Cash"
                  ? `₹${formatNumber(transaction.value, 2)}`
                  : `${formatNumber(transaction.value, 3)}g`}
              </td>
              <td>
                {transaction.type === "Cash"
                  ? formatNumber(transaction.goldRate,2)
                  : "-"}
              </td>
              <td>{formatNumber(transaction.purity,3)}</td>
              <td>
                {transaction.type === "Gold" ? `${formatNumber(transaction.touch,3)}%` : "-"}
              </td>
              <td style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleEdit(transaction)}
                  className="edit-btn"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="delete-btn"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totals.totalPurity > 0 && (
        <div className="transaction-totals">
          <h3>Transaction Totals</h3>
          <div className="total-row">
            <span>Total Purity:</span>
            <span>{formatNumber(totals.totalPurity, 3)} g</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customertrans;
