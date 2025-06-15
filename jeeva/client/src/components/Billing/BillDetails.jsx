import React, { useState, useEffect } from "react";
import {
  TextField,
  Box,
  Modal,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import { BACKEND_SERVER_URL } from "../../Config/Config";

const BillDetails = ({
  billItems,
  setBillItems,
  totalWeight,
  totalPurity,
  totalAmount,
  displayHallmarkCharges,
  setDisplayHallmarkCharges,
  setHallmarkCharges,
  viewMode,
  selectedBill,
  openAddItem,
  setOpenAddItem,
  stockData,
  showSnackbar,
}) => {
  const [newItem, setNewItem] = useState({
    name: "",
    no: "",
    percentage: "",
    weight: "",
    pure: "",
    touch: "",
  });
  const [availableStock, setAvailableStock] = useState(0);
  const [stockError, setStockError] = useState(null);

  useEffect(() => {
    if (newItem.percentage) {
      checkStockAvailability();
    }
  }, [newItem.percentage, newItem.name, newItem.no]);

  const checkStockAvailability = () => {
    if (!newItem.percentage) return;

    const selectedCoin = stockData.find(
      (item) =>
        item.gram === parseFloat(newItem.name || 0) &&
        item.coinType === newItem.percentage
    );

    if (selectedCoin) {
      setAvailableStock(selectedCoin.quantity);
      if (newItem.no && selectedCoin.quantity < parseInt(newItem.no)) {
        setStockError(`Insufficient stock Available: ${selectedCoin.quantity}`);
      } else {
        setStockError(null);
      }
    } else {
      setAvailableStock(0);
      if (newItem.name) {
        setStockError("No stock available for this combination");
      }
    }
  };

  const handleCloseAddItem = () => {
    setOpenAddItem(false);
    setNewItem({
      name: "",
      no: "",
      percentage: "",
      weight: "",
      pure: "",
      touch: "",
    });
    setStockError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewItem((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "weight") {
        const touch = parseFloat(updated.touch) || 0;
        const weight = parseFloat(value) || 0;
        if (touch && weight) {
          updated.pure = weight * (touch / 100);
        } else {
          updated.pure = "";
        }
      } else if (name === "name" || name === "no" || name === "touch") {
        const coin = parseFloat(updated.name) || 0;
        const no = parseFloat(updated.no) || 0;
        const touch = parseFloat(updated.touch) || 0;

        if (coin && no && touch) {
          const weight = coin * no;
          const pure = weight * (touch / 100);

          updated.weight = weight;
          updated.pure = pure;
        }
      }

      return updated;
    });
  };

  const handleSaveItem = () => {
    if (!newItem.name || !newItem.no || !newItem.percentage) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    if (stockError) {
      showSnackbar(stockError, "error");
      return;
    }

    setBillItems((prevItems) => [
      ...prevItems,
      {
        id: Date.now().toString(),
        coinValue: parseFloat(newItem.name),
        quantity: parseInt(newItem.no),
        percentage: newItem.percentage,
        touch: newItem.touch,
        weight: newItem.weight,
        purity: newItem.pure,
        goldRate: "",
        amount: "",
        displayName: `${newItem.name}g ${newItem.percentage}`,
      },
    ]);

    handleCloseAddItem();
  };

  const handleBillItemChange = (index, field, value) => {
    const updatedBillItems = [...billItems];
    updatedBillItems[index][field] = value;

    if (field === "goldRate") {
      const goldRateVal = parseFloat(value);
      const purityVal = parseFloat(updatedBillItems[index].purity);

      if (!isNaN(goldRateVal)) {
        updatedBillItems[index].amount =
          goldRateVal && purityVal ? goldRateVal * purityVal : "";
      }
    }

    setBillItems(updatedBillItems);
  };

  return (
    <Box className="itemsSection">
      <div className="bill">
        <h3>Bill Details:</h3>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th className="th">Coin Name</th>
            <th className="th">No</th>
            <th className="th">%</th>
            <th className="th">Weight</th>
            <th className="th">Purity</th>
            <th className="th">Amount</th>
            <th className="th">Gold Rate</th>
          </tr>
        </thead>
        <tbody>
          {billItems.map((item, index) => (
            <tr key={index}>
              <td className="td">
                {item.coinValue}g {item.percentage}
              </td>
              <td className="td">{item.quantity}</td>
              <td className="td">{item.touch}</td>
              <td className="td">{item.weight}</td>
              <td className="td">{item.purity}</td>
              <td className="td">
                {item.goldRate ? item.amount.toFixed(2) : ""}
              </td>

              <td className="td">
                <TextField
                  size="small"
                  value={item.goldRate || ""}
                  onChange={(e) =>
                    handleBillItemChange(index, "goldRate", e.target.value)
                  }
                  type="number"
                  disabled={viewMode && selectedBill}
                  inputProps={{ min: 0 }}
                />
              </td>
            </tr>
          ))}

          <tr>
            <td className="td">
              <strong>Total</strong>
            </td>
            <td className="td">
              <strong>
                {billItems.reduce(
                  (sum, item) => sum + parseInt(item.quantity),
                  0
                )}
              </strong>
            </td>
            <td className="td"></td>
            <td className="td">
              <strong>{totalWeight.toFixed(3)}</strong>
            </td>
            <td className="td">
              <strong>{totalPurity.toFixed(3)}</strong>
            </td>
            <td className="td">
              <strong>{totalAmount.toFixed(2)}</strong>
            </td>
            <td className="td"></td>
          </tr>

          <tr>
            <td className="td" colSpan={5}>
              <strong>Hallmark or MC Charges</strong>
            </td>
            <td className="td">
              <TextField
                size="small"
                style={{ width: "120px" }}
                value={displayHallmarkCharges}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setDisplayHallmarkCharges(value);
                  setHallmarkCharges(value);
                }}
                type="number"
                disabled={viewMode && selectedBill}
              />
            </td>
            <td className="td"></td>
          </tr>
          <tr>
            <td className="td" colSpan={5}>
              <strong>Total Amount</strong>
            </td>
            <td className="td">
              <strong>
                {selectedBill
                  ? (
                      totalAmount +
                      parseFloat(selectedBill?.hallmarkCharges || 0)
                    ).toFixed(2)
                  : (
                      totalAmount + parseFloat(displayHallmarkCharges || 0)
                    ).toFixed(2)}
              </strong>
            </td>
            <td className="td"></td>
          </tr>
        </tbody>
      </table>

      <Modal
        open={openAddItem}
        onClose={handleCloseAddItem}
        aria-labelledby="add-item-modal"
      >
        <Box className="modal-container">
          <Typography variant="h6" gutterBottom>
            Add Bill Details
          </Typography>
          <Box component="form" className="modal-form">
            <TextField
              fullWidth
              label="Coin Info (e.g. 8g 916)"
              name="coinInfo"
              value={newItem.coinInfo || ""}
              onChange={(e) => {
                const input = e.target.value;
                setNewItem((prev) => ({ ...prev, coinInfo: input }));

                const match = input.match(/(\d+(?:\.\d+)?)g\s*(916|999)/);
                if (match) {
                  const gram = parseFloat(match[1]);
                  const purity = match[2];

                  let autoPercentage = "";
                  let autoTouch = "";
                  if (purity === "916") {
                    autoPercentage = "916";
                    autoTouch = "92";
                  } else if (purity === "999") {
                    autoPercentage = "999";
                    autoTouch = "99.9";
                  }

                  setNewItem((prev) => ({
                    ...prev,
                    name: gram.toString(),
                    percentage: autoPercentage,
                    touch: autoTouch,
                    weight: "",
                    pure: "",
                  }));

                  const matchingStock = stockData.find(
                    (item) => item.coinType === purity && item.gram === gram
                  );

                  if (!matchingStock) {
                    setStockError(`No available stock for ${gram}g ${purity}`);
                    setAvailableStock(0);
                  } else {
                    setAvailableStock(matchingStock.quantity);
                    setStockError(null);
                  }
                } else {
                  setStockError("Invalid format. Use like '8g 916'");
                  setNewItem((prev) => ({
                    ...prev,
                    name: "",
                    percentage: "",
                    touch: "",
                  }));
                  setAvailableStock(0);
                }
              }}
              margin="normal"
              required
              disabled={viewMode && selectedBill}
            />
            {newItem.percentage && (
              <Box>
                {newItem.name ? (
                  <>
                    <Typography variant="body2">
                      Available Stock: {availableStock}
                    </Typography>
                    {stockError && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {stockError}
                      </Alert>
                    )}
                  </>
                ) : (
                  <Typography variant="body2">
                    Available coins for {newItem.percentage}:{" "}
                    {stockData
                      .filter((item) => item.coinType === newItem.percentage)
                      .map((item) => item.gram)
                      .join(", ")}
                  </Typography>
                )}
              </Box>
            )}

            <TextField
              fullWidth
              label="No of Coins"
              name="no"
              value={newItem.no}
              onChange={handleInputChange}
              margin="normal"
              type="number"
              required
              disabled={viewMode && selectedBill}
            />

            <TextField
              fullWidth
              label="Percentage"
              name="touch"
              value={newItem.touch || ""}
              onChange={handleInputChange}
              margin="normal"
              type="number"
              required
              disabled={viewMode && selectedBill}
            />

            <TextField
              fullWidth
              label="Weight (Auto-calculated)"
              name="weight"
              value={newItem.weight}
              onChange={handleInputChange}
              margin="normal"
              type="number"
              inputProps={{ step: "0.001" }}
            />

            <TextField
              fullWidth
              label="Purity (Auto-calculated)"
              name="pure"
              value={newItem.pure}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{ readOnly: true }}
            />

            <Box className="modal-actions">
              <Button onClick={handleCloseAddItem} className="cancel-button">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveItem}
                className="save-button"
                disabled={!!stockError || (viewMode && selectedBill)}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default BillDetails;
