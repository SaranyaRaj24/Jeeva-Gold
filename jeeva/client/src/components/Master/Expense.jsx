import React, { useState, useEffect } from "react";
import "./expense.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";
import { NumericFormat } from "react-number-format";

const MasterExpense = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    valueType: "cash/gold",
    purity: "",
    remarks: "",
  });

  const [entries, setEntries] = useState([]);
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [availableCashGold, setAvailableCashGold] = useState(0);
  const [availableAdvances, setAvailableAdvances] = useState(0);

  const [totalCashGoldEntriesPurity, setTotalCashGoldEntriesPurity] =
    useState(0);
  const [advancesGold, setAdvancesGold] = useState(0);

  const [loading, setLoading] = useState(true);
  const [totalPurity, setTotalPurity] = useState(0);

  const mapValueTypeToFrontend = (val) => {
    if (val === "CashOrGold") return "cash/gold";
    if (val === "Advance") return "advance";
    return val;
  };

  const mapValueTypeToBackend = (val) => {
    if (val === "cash/gold") return "CashOrGold";
    if (val === "advance") return "Advance";
    return val;
  };

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchEntries(), fetchLimits()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch(`${BACKEND_SERVER_URL}/api/expenses`);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();

      const normalized = data.map((exp) => ({
        ...exp,
        valueType: mapValueTypeToFrontend(exp.valueType),
      }));

      setEntries(normalized);

      const total = normalized.reduce(
        (sum, e) => sum + (parseFloat(e.purity) || 0),
        0
      );
      setTotalPurity(total);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching expenses.");
    }
  };

  const fetchLimits = async () => {
    try {
      const entriesRes = await fetch(`${BACKEND_SERVER_URL}/api/entries`);
      const entriesData = entriesRes.ok ? await entriesRes.json() : [];
      const manualEntriesPurity = entriesData.reduce(
        (sum, entry) => sum + parseFloat(entry.purity || 0),
        0
      );

      let bills = [];
      try {
        const billsRes = await fetch(`${BACKEND_SERVER_URL}/api/bills`);
        if (billsRes.ok) bills = await billsRes.json();
      } catch {}

      let receivedEntriesPurity = 0;
      bills.forEach((bill) => {
        if (bill.receivedDetails && Array.isArray(bill.receivedDetails)) {
          bill.receivedDetails.forEach((detail) => {
            const purity = parseFloat(detail.purityWeight || 0);
            if (detail.paidAmount > 0) {
              receivedEntriesPurity -= purity;
            } else {
              receivedEntriesPurity += purity;
            }
          });
        }
      });
      const totalCashGold = manualEntriesPurity + receivedEntriesPurity;

      let allTransactions = [];
      try {
        const transRes = await fetch(
          `${BACKEND_SERVER_URL}/api/transactions/all`
        );
        if (transRes.ok) {
          allTransactions = await transRes.json();
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.warn("Could not load transactions");
      }

      const advGold = allTransactions.reduce(
        (sum, t) => sum + parseFloat(t.purity || 0),
        0
      );

      let expenseSummary = [];
      try {
        const expenseRes = await fetch(
          `${BACKEND_SERVER_URL}/api/expenses/summary`
        );
        if (expenseRes.ok) {
          expenseSummary = await expenseRes.json();
        }
      } catch (error) {
        console.error("Error fetching expense summary:", error);
      }

      let expenseCashOrGold = 0;
      let expenseAdvance = 0;
      expenseSummary.forEach((exp) => {
        if (exp.valueType === "CashOrGold") {
          expenseCashOrGold += parseFloat(exp._sum?.purity || 0);
        }
        if (exp.valueType === "Advance") {
          expenseAdvance += parseFloat(exp._sum?.purity || 0);
        }
      });

      setAvailableCashGold(totalCashGold - expenseCashOrGold);
      setAvailableAdvances(advGold - expenseAdvance);

      setTotalCashGoldEntriesPurity(totalCashGold - expenseCashOrGold);

      setAdvancesGold(advGold - expenseAdvance);
    } catch (error) {
      console.error("Error fetching limits:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "purity") {
      const isValid = /^(\d+\.?\d*|\.\d*)?$/.test(value);
      if (!isValid && value !== "") return;
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredPurity = parseFloat(formData.purity || 0);

    if (formData.valueType === "cash/gold") {
      if (enteredPurity > totalCashGoldEntriesPurity) {
        toast.error(
          `Entered purity exceeds available Cash/Gold limit (${totalCashGoldEntriesPurity})`
        );
        return;
      }
    } else if (formData.valueType === "advance") {
      if (enteredPurity > advancesGold) {
        toast.error(
          `Entered purity exceeds available Advance limit (${advancesGold})`
        );
        return;
      }
    }

    try {
      const url = isEditMode
        ? `${BACKEND_SERVER_URL}/api/expenses/${editId}`
        : `${BACKEND_SERVER_URL}/api/expenses`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          valueType: mapValueTypeToBackend(formData.valueType),
        }),
      });

      if (!response.ok) throw new Error("Failed to save expense");
      const newExpense = await response.json();

      let updatedExpenses;
      if (isEditMode) {
        updatedExpenses = entries.map((expense) =>
          expense.id === editId
            ? {
                ...newExpense,
                valueType: mapValueTypeToFrontend(newExpense.valueType),
              }
            : expense
        );
        await fetchLimits();
        toast.success("Expense updated successfully!");
      } else {
        updatedExpenses = [
          ...entries,
          {
            ...newExpense,
            valueType: mapValueTypeToFrontend(newExpense.valueType),
          },
        ];
        await fetchLimits();
        toast.success("Expense added successfully!");
      }

      setEntries(updatedExpenses);
      setTotalPurity(
        updatedExpenses.reduce((sum, e) => sum + (parseFloat(e.purity) || 0), 0)
      );
      
      resetForm();
      setShowFormPopup(false);
    } catch (error) {
      console.error(error);
      toast.error("Error saving expense.");
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      valueType: "cash/gold",
      purity: "",
      remarks: "",
    });
    setIsEditMode(false);
    setEditId(null);
  };

  const handleEdit = (expense) => {
    const formattedDate = expense.date
      ? new Date(expense.date).toISOString().split("T")[0]
      : "";

    setFormData({
      date: formattedDate,
      valueType: expense.valueType,
      purity: expense.purity,
      remarks: expense.remarks,
    });
    setEditId(expense.id);
    setIsEditMode(true);
    setShowFormPopup(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );
    if (!confirmDelete) return;
    try {
      const response = await fetch(`${BACKEND_SERVER_URL}/api/expenses/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete expense");

      const updatedExpenses = entries.filter((expense) => expense.id !== id);
      setEntries(updatedExpenses);
      setTotalPurity(
        updatedExpenses.reduce((sum, e) => sum + (parseFloat(e.purity) || 0), 0)
      );
      toast.success("Expense deleted successfully!");
      await fetchLimits();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting expense.");
    }
  };

  if (loading) {
    return <p>Loading expenses and limits...</p>;
  }

  return (
    <div className="master-expense">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>Expense Management</h2>
      <button className="add-btn" onClick={() => setShowFormPopup(true)}>
        Add Expense
      </button>

      {showFormPopup && (
        <div className="popup-overlay">
          <div className="popup-contentsss">
            <h3>{isEditMode ? "Edit" : "Add"} Expense</h3>
            <button
              className="close-btnss"
              onClick={() => {
                setShowFormPopup(false);
                resetForm();
              }}
            >
              ×
            </button>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Value Type:</label>
                <select
                  name="valueType"
                  value={formData.valueType}
                  onChange={handleChange}
                  required
                >
                  <option value="cash/gold">Cash / Gold</option>
                  <option value="advance">Advance</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Purity (grams){" "}
                  {formData.valueType === "cash/gold"
                    ? `(Max: ${formatToFixed3Strict(availableCashGold)})`
                    : `(Max: ${formatToFixed3Strict(availableAdvances)})`}
                </label>

                <NumericFormat
                  name="purity"
                  value={formData.purity}
                  onValueChange={(values) => {
                    handleChange({
                      target: {
                        name: "purity",
                        value: values.floatValue,
                      },
                    });
                  }}
                  thousandSeparator=","
                  decimalScale={3}
                  allowNegative={false}
                />
              </div>

              <div className="form-group">
                <label>Remarks:</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter remarks..."
                />
              </div>

              <div className="button-group">
                <button type="submit" className="submit-btn">
                  {isEditMode ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowFormPopup(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="entries-section">
        <h3>Expense Entries</h3>
        {entries.length === 0 ? (
          <p>No expenses yet. Please add some expense entries.</p>
        ) : (
          <table className="entries-table">
            <thead>
              <tr>
                <th>SI. No.</th>
                <th>Date</th>
                <th>Value Type</th>
                <th>Purity (g)</th>
                <th>Remarks</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td>{index + 1}</td>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td>
                    {entry.valueType === "cash/gold"
                      ? "Cash / Gold"
                      : "Advance"}
                  </td>
                  <td>{formatToFixed3Strict(entry.purity)}</td>
                  <td className="remarks-cell">{entry.remarks}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(entry)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(entry.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan="3"
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  Total Purity:
                </td>
                <td colSpan="4" style={{ fontWeight: "bold" }}>
                  {formatToFixed3Strict(totalPurity)} g
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default MasterExpense;
