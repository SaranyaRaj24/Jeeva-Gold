import React, { useState, useEffect, useRef } from "react";
import {
  Autocomplete,
  TextField,
  Box,
  Button,
  Modal,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import AddIcon from "@mui/icons-material/Add";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import "./Billing.css";
import { MdDeleteForever } from "react-icons/md";
import { BACKEND_SERVER_URL } from "../../Config/Config";

const Billing = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [billNo, setBillNo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [goldRate, setGoldRate] = useState("");
  const [hallmarkCharges, setHallmarkCharges] = useState(0);
  const [rows, setRows] = useState([
    {
      date: new Date().toISOString().slice(0, 10),
      goldRate: "",
      givenGold: "",
      touch: "",
      purityWeight: "",
      amount: "",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [fetchedBills, setFetchedBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [openAddItem, setOpenAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    no: "",
    percentage: "",
    weight: "",
    pure: "",
    touch: "",
  });

  const [customers, setCustomers] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [stockError, setStockError] = useState(null);
  const [availableStock, setAvailableStock] = useState(0);
  const [latestBill, setLatestBill] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const billRef = useRef(null);
  const [displayHallmarkCharges, setDisplayHallmarkCharges] = useState(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const customersResponse = await fetch(
          `${BACKEND_SERVER_URL}/api/customers`
        );
        const customersData = await customersResponse.json();
        setCustomers(customersData);

        const stocksResponse = await fetch(
          `${BACKEND_SERVER_URL}/api/v1/stocks`
        );
        const stocksData = await stocksResponse.json();
        setStockData(stocksData);

        const billsResponse = await fetch(`${BACKEND_SERVER_URL}/api/bills`);
        const billsData = await billsResponse.json();
        const latest = billsData.length > 0 ? billsData[0] : null;
        setLatestBill(latest);
        setBillNo(latest ? `BILL-${parseInt(latest.id) + 1}` : "BILL-1");
      } catch (error) {
        console.error("Error fetching initial data:", error);
        showSnackbar("Failed to load initial data", "error");
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (newItem.percentage) {
      checkStockAvailability();
    }
  }, [newItem.percentage, newItem.name, newItem.no]);

  const fetchBills = async () => {
    try {
      const response = await fetch(`${BACKEND_SERVER_URL}/api/bills`);
      const data = await response.json();
      setFetchedBills(data);
      showSnackbar("Bills fetched successfully", "success");
    } catch (error) {
      console.error("Error fetching bills:", error);
      showSnackbar("Failed to fetch bills", "error");
    }
  };

  const viewBill = (bill) => {
    console.log("aksh", bill);

    setViewMode(true);
    setSelectedBill(bill);
    setSelectedCustomer(customers.find((c) => c.id === bill.customerId));
    setGoldRate(bill.goldRate.toString());
    setHallmarkCharges(bill.hallmarkBalance.toString());
    setBillItems(
      bill.items.map((item) => ({
        id: item.id || Date.now().toString(),
        coinValue: item.coinValue,
        quantity: item.quantity,
        percentage: item.percentage,
        touch: item.touch,
        weight: item.weight,
        purity: item.purity,
        goldRate: item.goldRate ? item.goldRate.toString() : "",
        amount:
          item.goldRate && item.purity
            ? (item.goldRate * item.purity).toFixed(2)
            : "",
      }))
    );

    setRows(
      bill.receivedDetails.map((detail) => ({
        date: detail.date
          ? new Date(detail.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        goldRate: detail.goldRate?.toString(),
        givenGold: detail.givenGold?.toString(),
        touch: detail.touch?.toString() || "",
        purityWeight: detail.purityWeight.toString(),
        amount: detail.amount?.toString(),
      }))
    );

    setBillNo(`BILL-${bill.id}`);
  };

  const handleDeleteBill = async (billId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this bill? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/bills/${billId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete bill");
      }

      showSnackbar("Bill deleted successfully!", "success");

      const updatedBills = fetchedBills.filter((bill) => bill.id !== billId);
      setFetchedBills(updatedBills);

      if (selectedBill && selectedBill.id === billId) {
        resetForm();
      }
    } catch (error) {
      console.error("Error:", error);
      showSnackbar(error.message || "Failed to delete bill", "error");
    }
  };

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

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        date: new Date().toISOString().slice(0, 10),
        goldRate: goldRate,
        givenGold: "",
        touch: "",
        purityWeight: "",
        amount: "",
      },
    ]);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];

    if (value === "") {
      updatedRows[index][field] = "";
      setRows(updatedRows);
      return;
    }

    updatedRows[index][field] = value;

    if (field === "givenGold" || field === "touch") {
      const givenGold = parseFloat(updatedRows[index].givenGold) || 0;
      const touch = parseFloat(updatedRows[index].touch) || 0;
      const purityWeight = givenGold * (touch / 100);
      updatedRows[index].purityWeight = purityWeight.toFixed(3);

      if (updatedRows[index].goldRate) {
        const amount = purityWeight * parseFloat(updatedRows[index].goldRate);
        updatedRows[index].amount = amount.toFixed(2);
      }
    } else if (field === "amount") {
      console.log("in amount");
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        console.log("in amount 2");
        const hallmarkBalance = parseFloat(hallmarkCharges) || 0;
        const purityBalance = parseFloat(pureBalance) || 0;
        console.log("sssssss", numValue, hallmarkBalance);

        if (numValue <= hallmarkBalance) {
          setHallmarkCharges((prev) => (prev - numValue).toFixed(2));
        } else {
          console.log("4");
          setHallmarkCharges(0);
          const remainingAmount = numValue - hallmarkBalance;
          const updatedPurity = numValue / updatedRows[index].goldRate;

          const newPurity = (updatedPurity - receivedPurity).toFixed(3);
          console.log(
            "in amount 2",
            newPurity,
            purityBalance,
            updatedPurity,
            receivedPurity,
            remainingAmount,
            receivedAmount,
            numValue
          );

          if (newPurity > 0 || updatedPurity < receivedPurity) {
            console.log("balance", updatedPurity, purityBalance);
            if (remainingAmount >= 0) {
              updatedRows[index].purityWeight = updatedPurity;
            } else {
              showSnackbar("Amount exceeds available pure balances", "error");
            }
          }
        }
      }
    } else if (field === "goldRate") {
      const goldRateVal = parseFloat(value) || 0;
      if (updatedRows[index].givenGold && updatedRows[index].touch) {
        const givenGold = parseFloat(updatedRows[index].givenGold) || 0;
        const touch = parseFloat(updatedRows[index].touch) || 0;
        const purityWeight = givenGold * (touch / 100);
        const amount = purityWeight * goldRateVal;
        updatedRows[index].amount = amount.toFixed(2);
        updatedRows[index].purityWeight = purityWeight.toFixed(3);
      } else if (updatedRows[index].amount) {
        const amount = parseFloat(updatedRows[index].amount) || 0;
        const purityWeight = amount / goldRateVal;
        updatedRows[index].purityWeight = purityWeight.toFixed(3);
      }
    }

    setRows(updatedRows);
  };

  /*  useEffect(() => {
    if (goldRate) {
      const updatedRows = rows.map((row) => {
        if (row.purityWeight) {
          const amount = parseFloat(row.purityWeight) * parseFloat(goldRate);
          return { ...row, amount: amount.toFixed(2), goldRate: goldRate };
        }
        return { ...row, goldRate: goldRate };
      });
      console.log("------------------------------")
      setRows(updatedRows);
    }
  }, [goldRate]); */

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDate(now.toLocaleDateString("en-IN"));
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAddItem = () => {
    setOpenAddItem(true);
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

      if (name === "name" || name === "no" || name === "touch") {
        const coin = parseFloat(updated.name) || 0;
        const no = parseFloat(updated.no) || 0;
        const touch = parseFloat(updated.touch) || 0;

        if (coin && no && touch) {
          const weight = coin * no;
          const pure = weight * (touch / 100);

          updated.weight = weight.toFixed(3);
          updated.pure = pure.toFixed(3);
        }
      }

      return updated;
    });
  };

  const calculateValues = () => {
    const coin = parseFloat(newItem.name) || 0;
    const no = parseFloat(newItem.no) || 0;
    const touch = parseFloat(newItem.touch) || 0;

    if (coin && no && touch) {
      const weight = coin * no;
      const pure = weight * (touch / 100);

      setNewItem((prev) => ({
        ...prev,
        weight: weight.toFixed(3),
        pure: pure.toFixed(3),
      }));
    }
  };

  useEffect(() => {
    if (newItem.name && newItem.no && newItem.touch) {
      calculateValues();
    }
  }, [newItem.name, newItem.no, newItem.touch]);

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

  const calculateTotals = () => {
    let totalWeight = 0;
    let totalPurity = 0;
    let totalAmount = 0;

    billItems.forEach((item) => {
      totalWeight += parseFloat(item.weight) || 0;
      totalPurity += parseFloat(item.purity) || 0;
      const itemGoldRate = parseFloat(item.goldRate);
      if (!isNaN(itemGoldRate) && itemGoldRate > 0) {
        totalAmount += itemGoldRate * (parseFloat(item.purity) || 0);
      }
    });

    return { totalWeight, totalPurity, totalAmount };
  };

  const { totalWeight, totalPurity, totalAmount } = calculateTotals();

  const calculateReceivedTotals = () => {
    const receivedAmount = rows.reduce(
      (sum, row) => sum + parseFloat(row.amount || 0),
      0
    );
    const receivedPurity = rows.reduce(
      (sum, row) => sum + parseFloat(row.purityWeight || 0),
      0
    );

    return { receivedAmount, receivedPurity };
  };

  const { receivedAmount, receivedPurity } = calculateReceivedTotals();

  const calculateBalances = () => {
    const totalPurity = billItems.reduce(
      (sum, item) => sum + parseFloat(item.purity || 0),
      0
    );

    const totalReceivedPurity = rows.reduce(
      (sum, row) => sum + parseFloat(row.purityWeight || 0),
      0
    );

    const pureBalance = totalPurity - totalReceivedPurity;

    const latestRowWithGoldRate = [...rows]
      .reverse()
      .find((row) => parseFloat(row.goldRate));
    const latestGoldRate = latestRowWithGoldRate
      ? parseFloat(latestRowWithGoldRate.goldRate)
      : 0;

    console.log("pure balance ", pureBalance, latestGoldRate);

    const cashBalance = latestGoldRate * pureBalance;
    const totalBalance = cashBalance + parseFloat(hallmarkCharges || 0);

    return {
      cashBalance: cashBalance.toFixed(2),
      pureBalance: pureBalance.toFixed(3),
      totalBalance: totalBalance.toFixed(2),
    };
  };

  const { cashBalance, pureBalance, totalBalance } = calculateBalances();

  const handleBillItemChange = (index, field, value) => {
    const updatedBillItems = [...billItems];
    updatedBillItems[index][field] = value;

    if (field === "goldRate") {
      const goldRateVal = parseFloat(value);
      const purityVal = parseFloat(updatedBillItems[index].purity);
      setGoldRate(value)

      if (!isNaN(goldRateVal) && goldRateVal > 0 && purityVal) {
        updatedBillItems[index].amount = (goldRateVal * purityVal).toFixed(2);
      } else {
        updatedBillItems[index].amount = "";
      }
    }

    setBillItems(updatedBillItems);
  };

  const handleUpdateBill = async () => {
    if (!selectedBill || !selectedCustomer) {
      showSnackbar("Invalid bill data", "error");
      return;
    }
    setIsUpdating(true);
    try {
      const updatedBill = {
        ...selectedBill,
        items: billItems.map((item) => ({
          coinValue: parseFloat(item.coinValue),
          quantity: parseInt(item.quantity),
          percentage: parseInt(item.percentage),
          touch: parseFloat(item.touch || 0),
          weight: parseFloat(item.weight || 0),
          purity: parseFloat(item.purity || 0),
          goldRate: parseFloat(item.goldRate || 0),
          amount: item.amount ? parseFloat(item.amount) : 0,
        })),
        receivedDetails: [
          ...selectedBill.receivedDetails,
          ...rows.slice(selectedBill.receivedDetails.length).map((row) => ({
            date: row.date || new Date().toISOString().split("T")[0],
            goldRate: parseFloat(row.goldRate || goldRate),
            givenGold: parseFloat(row.givenGold || 0),
            touch: parseFloat(row.touch || 0),
            purityWeight: parseFloat(row.purityWeight || 0),
            amount: parseFloat(row.amount || 0),
          })),
        ],
      };

      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/bills/${selectedBill.id}/receive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedBill),
        }
      );

      if (!response.ok) throw new Error("Failed to update bill");

      const data = await response.json();
      setSelectedBill(data);
      showSnackbar("Bill updated successfully!", "success");
      fetchBills();
    } catch (error) {
      console.error("Error:", error);
      showSnackbar(error.message || "Failed to update bill", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const reduceStockForBill = async (items) => {
    try {
      const results = await Promise.allSettled(
        items.map(async (item) => {
          const response = await fetch(
            `${BACKEND_SERVER_URL}/api/v1/stocks/reduce`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                coinType: item.percentage.toString(),
                gram: item.coinValue.toString(),
                quantity: item.quantity.toString(),
                reason: `Sold in bill (${item.coinValue}g ${item.percentage})`,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to reduce stock");
          }
          return response.json();
        })
      );

      const failedReductions = results.filter((r) => r.status === "rejected");
      if (failedReductions.length > 0) {
        const errorMessages = failedReductions
          .map((f) => f.reason.message)
          .join(", ");
        throw new Error(`Some items couldn't be reduced: ${errorMessages}`);
      }

      return results.map((r) => r.value);
    } catch (error) {
      console.error("Stock reduction error:", error);
      throw error;
    }
  };

  const handleSubmitBill = async () => {
    if (!selectedCustomer || billItems.length === 0) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await reduceStockForBill(billItems);

      const totalWeight = billItems.reduce(
        (sum, item) => sum + parseFloat(item.weight || 0),
        0
      );
      const totalPurity = billItems.reduce(
        (sum, item) => sum + parseFloat(item.purity || 0),
        0
      );
      const totalAmountCalc = billItems.reduce((sum, item) => {
        const itemGoldRate = parseFloat(item.goldRate);
        if (!isNaN(itemGoldRate) && itemGoldRate > 0) {
          return sum + itemGoldRate * (parseFloat(item.purity) || 0);
        } else return sum;
      }, 0);

      const totalAmount = totalAmountCalc + parseFloat(hallmarkCharges || 0);

      console.log("g", billItems, rows, goldRate);

      const billData = {
        customerId: selectedCustomer.id,
        goldRate: parseFloat(goldRate),
        hallmarkCharges: parseFloat(displayHallmarkCharges || 0),
        hallmarkBalance: parseFloat(hallmarkCharges || 0),
        totalWeight,
        totalPurity,
        totalAmount,
        items: billItems.map((item) => ({
          coinValue: parseFloat(item.coinValue),
          quantity: parseInt(item.quantity),
          percentage: parseInt(item.percentage),
          touch: parseFloat(item.touch || 0),
          weight: parseFloat(item.weight || 0),
          purity: parseFloat(item.purity || 0),
          goldRate: parseFloat(item.goldRate || 0),
          amount: item.amount ? parseFloat(item.amount) : 0,
        })),
        receivedDetails: rows.map((row) => ({
          date: row.date ? new Date(row.date) : new Date(),
          goldRate: parseFloat(row.goldRate),
          givenGold: parseFloat(row.givenGold || 0),
          touch: parseFloat(row.touch || 0),
          purityWeight: parseFloat(row.purityWeight || 0),
          amount: parseFloat(row.amount || 0),
        })),
      };

      console.log("kiagusbsaliurasbd", billData)

      const response = await fetch(`${BACKEND_SERVER_URL}/api/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });

      if (!response.ok) throw new Error("Failed to create bill");

      const newBill = await response.json();
      setLatestBill(newBill);
      showSnackbar("Bill created successfully!", "success");

      await fetchBills();
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      showSnackbar(error.message || "Failed to create bill", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setBillItems([]);
    setRows([
      {
        date: new Date().toISOString().slice(0, 10),
        goldRate: "",
        givenGold: "",
        touch: "",
        purityWeight: "",
        amount: "",
      },
    ]);
    setSelectedCustomer(null);
    setGoldRate("");
    setHallmarkCharges(0);
    setSelectedBill(null);
    setViewMode(false);
    setIsSubmitting(false);
    setIsUpdating(false);

    const newBillNo = latestBill
      ? `BILL-${parseInt(latestBill.id) + 1}`
      : "BILL-1";
    setBillNo(newBillNo);
  };

  const handlePrint = async () => {
    const printButton = document.querySelector(".add-circle-icon");
    let printButtonParent = null;
    let printButtonClone = null;

    if (printButton) {
      printButtonParent = printButton.parentNode;
      printButtonClone = printButton.cloneNode(true);
      printButtonParent.removeChild(printButton);
    }

    const input = billRef.current;
    if (input) {
      const canvas = await html2canvas(input, {
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("l", "mm", "a5");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidthInPx = canvas.width;
      const imgHeightInPx = canvas.height;
      const ratio = imgWidthInPx / imgHeightInPx;

      let finalImgWidth = pageWidth;
      let finalImgHeight = pageWidth / ratio;

      if (finalImgHeight > pageHeight) {
        finalImgHeight = pageHeight;
        finalImgWidth = pageHeight * ratio;
      }

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);

      pdf.save("bill.pdf");
    }

    if (printButtonClone && printButtonParent) {
      printButtonParent.appendChild(printButtonClone);
    }
  };

  console.log("asiuf", rows);

  return (
    <>
      <Box className="sidebar">
        <Tooltip title="Add Bill Details" arrow placement="right">
          <div className="sidebar-button" onClick={handleAddItem}>
            <AddIcon />
            <span>Add</span>
          </div>
        </Tooltip>

        <Tooltip title="Print Bill" arrow placement="right">
          <div className="sidebar-button" onClick={handlePrint}>
            <PrintIcon />
            <span>Print</span>
          </div>
        </Tooltip>

        <Tooltip
          title={viewMode ? "Create New Bill" : "View Saved Bills"}
          arrow
          placement="right"
        >
          <div
            className="sidebar-button"
            onClick={() => {
              if (viewMode) {
                setViewMode(false);
                resetForm();
              } else {
                fetchBills();
                setViewMode(true);
              }
            }}
          >
            <span>{viewMode ? "New" : "View"}</span>
          </div>
        </Tooltip>

        {selectedBill && (
          <Tooltip title="Exit View Mode" arrow placement="right">
            <div
              className="sidebar-button"
              onClick={() => {
                setSelectedBill(null);
                setViewMode(false);
                resetForm();
                setIsUpdating(false);
              }}
            >
              <span>Exit</span>
            </div>
          </Tooltip>
        )}

        {!viewMode && (
          <Tooltip title="Save Bill" arrow placement="right">
            <div
              className="sidebar-button"
              onClick={handleSubmitBill}
              style={{
                opacity:
                  !selectedCustomer || billItems.length === 0 || isSubmitting
                    ? 0.5
                    : 1,
                pointerEvents:
                  !selectedCustomer || billItems.length === 0 || isSubmitting
                    ? "none"
                    : "auto",
              }}
            >
              <span>Save</span>
            </div>
          </Tooltip>
        )}

        {viewMode && selectedBill && (
          <Tooltip title="Update Bill" arrow placement="right">
            <div
              className="sidebar-button"
              onClick={handleUpdateBill}
              style={{
                opacity: rows.length === 0 || isUpdating ? 0.5 : 1,
                pointerEvents:
                  rows.length === 0 || isUpdating ? "none" : "auto",
              }}
            >
              <span>Update</span>
            </div>
          </Tooltip>
        )}

        <Tooltip title="Delete Bill" arrow placement="right">
          <div
            className="sidebar-button"
            onClick={() => selectedBill && handleDeleteBill(selectedBill.id)}
            style={{ backgroundColor: "#ffebee" }}
          >
            <span style={{ color: "#c62828" }}>Delete</span>
          </div>
        </Tooltip>
      </Box>
      <Modal
        open={viewMode && !selectedBill}
        onClose={() => setViewMode(false)}
        aria-labelledby="view-bills-modal"
      >
        <Box
          className="modal-container"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <Typography variant="h6" gutterBottom>
            Select a Bill to View
          </Typography>
          <table className="table">
            <thead>
              <tr>
                <th className="th">Bill No</th>
                <th className="th">Customer</th>
                <th className="th">Date</th>
                <th className="th">Total Amount</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody>
              {fetchedBills.map((bill) => (
                <tr key={bill.id}>
                  <td className="td">BILL-{bill.id}</td>
                  <td className="td">
                    {customers.find((c) => c.id === bill.customerId)?.name ||
                      "Unknown"}
                  </td>
                  <td className="td">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </td>
                  <td className="td">
                    {(
                      bill.items.reduce(
                        (sum, item) => sum + item.purity * bill.goldRate,
                        0
                      ) + (bill.hallmarkCharges || 0)
                    ).toFixed(2)}
                  </td>
                  <td className="td">
                    <Button variant="outlined" onClick={() => viewBill(bill)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            onClick={() => setViewMode(false)}
            style={{ marginTop: "1rem" }}
            variant="contained"
          >
            Close
          </Button>
        </Box>
      </Modal>

      {(!viewMode || selectedBill) && (
        <Box className="container" ref={billRef}>
          <h1 className="heading">Estimate Only</h1>

          <Box className="billInfo">
            <p>
              <strong>Bill No:</strong> {billNo}
            </p>
            <p className="date-time">
              <strong>Date:</strong> {date} <br />
              <br />
              <strong>Time:</strong> {time}
            </p>
          </Box>

          <Box className="searchSection">
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => option.name || ""}
              onChange={(event, newValue) => setSelectedCustomer(newValue)}
              value={selectedCustomer}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Customer"
                  variant="outlined"
                  size="small"
                  required
                  disabled={viewMode && selectedBill}
                />
              )}
              className="smallAutocomplete"
              disabled={viewMode && selectedBill}
            />
          </Box>

          {selectedCustomer && (
            <Box className="customerDetails">
              <h3>Customer Details:</h3>
              <br />
              <p>
                <strong>Name:</strong> {selectedCustomer?.name || "-"}
              </p>
            </Box>
          )}

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
                    <td className="td">{item.goldRate ? item.amount : ""}</td>
                    <td className="td">
                      <TextField
                        size="small"
                        value={item.goldRate || ""}
                        onChange={(e) =>
                          handleBillItemChange(
                            index,
                            "goldRate",
                            e.target.value
                          )
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
                        setDisplayHallmarkCharges(e.target.value);
                        setHallmarkCharges(e.target.value);
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
                      {(totalAmount + parseFloat(hallmarkCharges || 0)).toFixed(
                        2
                      )}
                    </strong>
                  </td>
                  <td className="td"></td>
                </tr>
              </tbody>
            </table>
          </Box>

          <Box className="itemsSection">
            <div className="add">
              <h3>Received Details:</h3>
              {(!viewMode || selectedBill) && (
                <p style={{ marginLeft: "42.4rem" }}>
                  <IconButton
                    size="small"
                    onClick={handleAddRow}
                    className="add-circle-icon"
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                </p>
              )}
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th className="th">S.No</th>
                  <th className="th">Date</th>
                  <th className="th">Gold WT</th>
                  <th className="th">Gold Rate</th>
                  <th className="th">%</th>
                  <th className="th">Purity WT</th>
                  <th className="th">Amount</th>
                  {(!viewMode || selectedBill) && (
                    <th className="th">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td className="td">{index + 1}</td>
                    <td className="td">
                      <TextField
                        style={{ right: "17px" }}
                        size="small"
                        type="date"
                        value={row.date}
                        onChange={(e) =>
                          handleRowChange(index, "date", e.target.value)
                        }
                        disabled={
                          viewMode &&
                          index < selectedBill?.receivedDetails?.length
                        }
                      />
                    </td>
                    <td className="td">
                      <TextField
                        size="small"
                        value={row.givenGold}
                        onChange={(e) =>
                          handleRowChange(index, "givenGold", e.target.value)
                        }
                        type="number"
                        disabled={
                          viewMode &&
                          index < selectedBill?.receivedDetails?.length
                        }
                      />
                    </td>
                    <td className="td">
                      <TextField
                        size="small"
                        value={row.goldRate}
                        onChange={(e) =>
                          handleRowChange(index, "goldRate", e.target.value)
                        }
                        type="number"
                        disabled={
                          viewMode &&
                          index < selectedBill?.receivedDetails?.length
                        }
                      />
                    </td>
                    <td className="td">
                      <TextField
                        size="small"
                        value={row.touch}
                        onChange={(e) =>
                          handleRowChange(index, "touch", e.target.value)
                        }
                        type="number"
                        disabled={
                          viewMode &&
                          index < selectedBill?.receivedDetails?.length
                        }
                      />
                    </td>
                    <td className="td">
                      <TextField
                        size="small"
                        value={Number(row.purityWeight).toFixed(2)}
                        InputProps={{ readOnly: true }}
                      />
                    </td>
                    <td className="td">
                      <TextField
                        size="small"
                        value={row.amount}
                        onChange={(e) =>
                          handleRowChange(index, "amount", e.target.value)
                        }
                        type="number"
                        disabled={
                          viewMode &&
                          index < selectedBill?.receivedDetails?.length
                        }
                      />
                    </td>
                    {(!viewMode || selectedBill) && (
                      <td className="td">
                        {(!viewMode ||
                          index >= selectedBill?.receivedDetails?.length) && (
                          <IconButton onClick={() => handleDeleteRow(index)}>
                            <MdDeleteForever />
                          </IconButton>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex">
              <b>Cash Balance: {cashBalance}</b>
              <b>Pure Balance: {pureBalance}</b>
              <b>Total Balance: {totalBalance}</b>
              <b>Hallmark Balance: {hallmarkCharges}</b>
            </div>
          </Box>
        </Box>
      )}

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
            />

            <TextField
              fullWidth
              label="Purity (Auto-calculated)"
              name="pure"
              value={newItem.pure}
              onChange={handleInputChange}
              margin="normal"
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Billing;
