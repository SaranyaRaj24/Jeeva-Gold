
import React, { useState, useMemo, useEffect } from "react";
import "./Stock.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";

const Stock = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [filterCoinType, setFilterCoinType] = useState("");
  const [filterGram, setFilterGram] = useState("");
  const [formData, setFormData] = useState({
    coinType: "",
    gram: "",
    quantity: "",
    touch: "",
    totalWeight: "",
    purity: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);


  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const response = await fetch(`${BACKEND_SERVER_URL}/api/v1/stocks`);
      const data = await response.json();
      setStockItems(data);
    } catch (err) {
      console.error("Error fetching stocks:", err);
      toast.error("Failed to fetch stock items!");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    if (["gram", "quantity", "touch"].includes(name)) {
      const gram = parseFloat(updatedData.gram) || 0;
      const quantity = parseInt(updatedData.quantity) || 0;
      const touch = parseFloat(updatedData.touch) || 0;
      updatedData.totalWeight = (gram * quantity).toFixed(2);
      updatedData.purity = ((touch * gram * quantity) / 100).toFixed(3);
    }

    setFormData(updatedData);
  };

  const handleSubmit = async () => {
    if (
      !formData.coinType ||
      !formData.gram ||
      !formData.quantity ||
      !formData.touch
    ) {
      toast.error("Please fill in all required fields!");
      return;
    }

    try {
      if (editIndex !== null) {
        await handleUpdate();
      } else {
        await handleCreateOrUpdate();
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Operation failed!");
    }
  };

  const handleUpdate = async () => {
    try {
      const updatedItem = formData;
      const itemId = stockItems[editIndex].id;

      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/v1/stocks/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem),
        }
      );

      if (!response.ok) throw new Error("Failed to update stock item");

      const result = await response.json();
      const updatedItems = [...stockItems];
      updatedItems[editIndex] = result.data;
      setStockItems(updatedItems);
      toast.success("Stock item updated successfully!");
      resetForm();
    } catch (err) {
      console.error("Error updating stock:", err);
      toast.error("Failed to update stock item!");
    }
  };

  const handleCreateOrUpdate = async () => {
    const existingItemIndex = stockItems.findIndex(
      (item) =>
        item.coinType === formData.coinType &&
        parseFloat(item.gram) === parseFloat(formData.gram)
    );

    if (existingItemIndex !== -1) {
      await updateExistingItem(existingItemIndex);
    } else {
      await createNewItem();
    }
  };

  const updateExistingItem = async (index) => {
    try {
      const updatedItem = {
        ...stockItems[index],
        quantity: (
          parseInt(stockItems[index].quantity) + parseInt(formData.quantity)
        ).toString(),
        totalWeight: (
          parseFloat(stockItems[index].totalWeight) +
          parseFloat(formData.totalWeight)
        ).toFixed(2),
        purity: (
          parseFloat(stockItems[index].purity) + parseFloat(formData.purity)
        ).toFixed(3),
      };

      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/v1/stocks/${stockItems[index].id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem),
        }
      );

      if (!response.ok) throw new Error("Failed to update stock item");

      const result = await response.json();
      const updatedItems = [...stockItems];
      updatedItems[index] = result.data;
      setStockItems(updatedItems);
      toast.success("Existing stock item updated successfully!");
      resetForm();
    } catch (err) {
      console.error("Error updating stock:", err);
      toast.error("Failed to update stock item!");
    }
  };

  const createNewItem = async () => {
    try {
      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/v1/stocks/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create stock item");

      const result = await response.json();
      setStockItems([result.data, ...stockItems]);
      toast.success("New stock item created successfully!");
      resetForm();
    } catch (err) {
      console.error("Error adding stock:", err);
      toast.error("Failed to create stock item!");
    }
  };

  const resetForm = () => {
    setFormData({
      coinType: "",
      gram: "",
      quantity: "",
      touch: "",
      totalWeight: "",
      purity: "",
    });
    setEditIndex(null);
    setEditingId(null);
    setShowPopup(false);
  };

  const handleEdit = (index) => {
    setFormData({
      ...stockItems[index],
      gram: stockItems[index].gram.toString(),
      quantity: stockItems[index].quantity.toString(),
      touch: stockItems[index].touch.toString(),
    });
    setEditIndex(index);
    setEditingId(stockItems[index].id);
    setShowPopup(true);
  };

  const handleDelete = async (index) => {
    const itemToDelete = stockItems[index];

    try {
      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/v1/stocks/${itemToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete stock item");

      const updatedItems = stockItems.filter((_, i) => i !== index);
      setStockItems(updatedItems);
      toast.success("Stock item deleted successfully!");
    } catch (err) {
      console.error("Error deleting stock:", err);
      toast.error("Failed to delete stock item!");
    }
  };

  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      return (
        (filterCoinType === "" ||
          item.coinType
            ?.toLowerCase()
            .includes(filterCoinType.toLowerCase())) &&
        (filterGram === "" || item.gram?.toString().includes(filterGram))
      );
    });
  }, [stockItems, filterCoinType, filterGram]);

  const totals = useMemo(() => {
    let totalWeightSum = 0;
    let totalPuritySum = 0;

    filteredStockItems.forEach((item) => {
      totalWeightSum += parseFloat(item.totalWeight) || 0;
      totalPuritySum += parseFloat(item.purity) || 0;
    });

    return {
      totalWeight: totalWeightSum.toFixed(2),
      purity: totalPuritySum.toFixed(3),
    };
  }, [filteredStockItems]);

  return (
    <div className="stock-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>Coin Stock Report</h2>
      <button className="add-btn" onClick={() => setShowPopup(true)}>
        Add Item
      </button>

      <div className="filter-section">
        <input
          type="text"
          placeholder="Filter by Coin Type"
          value={filterCoinType}
          onChange={(e) => setFilterCoinType(e.target.value)}
        />

        <input
          type="text"
          placeholder="Filter by Gram"
          value={filterGram}
          onChange={(e) => setFilterGram(e.target.value)}
        />
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>{editIndex !== null ? "Edit Coin Stock" : "Add Coin Stock"}</h3>
            <input
              type="text"
              name="coinType"
              placeholder="Coin Type"
              value={formData.coinType}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="gram"
              placeholder="Gram"
              value={formData.gram}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
            />
            <input
              type="number"
              name="touch"
              placeholder="Touch"
              value={formData.touch}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="999.9"
              required
            />
            <input
              type="number"
              name="totalWeight"
              placeholder="Total Weight"
              value={formData.totalWeight}
              readOnly
            />
            <input
              type="number"
              name="purity"
              placeholder="Purity"
              value={formData.purity}
           
              readOnly
            />

            <div className="popup-buttons">
              <button className="save-btn" onClick={handleSubmit}>
                {editIndex !== null ? "Update" : "Save"}
              </button>
              <button className="close-btn" onClick={resetForm}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Coin Type</th>
              <th>Gram</th>
              <th>Quantity</th>
              <th>%</th>
              <th>Total Weight</th>
              <th>Purity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStockItems.map((item, index) => (
              <tr key={item.id || index}>
                <td>{item.coinType}</td>
                <td>{item.gram}</td>
                <td>{item.quantity}</td>
                <td>{item.touch}</td>
                <td>{parseFloat(item.totalWeight).toFixed(2)}</td>
                <td>{parseFloat(item.purity).toFixed(3)}</td>
              
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(index)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" style={{ textAlign: "right" }}>
                <strong>Totals:</strong>
              </td>
              <td>
                <strong>{totals.totalWeight}</strong>
              </td>
              <td>
                <strong>{totals.purity}</strong>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default Stock;


