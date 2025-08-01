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
import html2canvas from "html2canvas";
import AddIcon from "@mui/icons-material/Add";
import "./Billing.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import BillDetails from "./BillDetails";
import ReceivedDetails from "./ReceivedDetails";
import ViewBill from "./ViewBill";

const Billing = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [billNo, setBillNo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [goldRate, setGoldRate] = useState("");
  const [hallmarkCharges, setHallmarkCharges] = useState(0);
  const [displayHallmarkCharges, setDisplayHallmarkCharges] = useState("");

  const [rows, setRows] = useState([
    {
      date: new Date().toISOString().slice(0, 10),
      goldRate: "",
      givenGold: "",
      touch: "",
      purityWeight: "",
      amount: "",
      paidAmount: "",
      mode: "",
    },
  ]);

  const [pureBalance, setPureBalance] = useState(0);

  const [totalBalance, setTotalBalance] = useState(0);
  const [hallmarkBalance, setHallmarkBalance] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [fetchedBills, setFetchedBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [customers, setCustomers] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [latestBill, setLatestBill] = useState(null);
  const billRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [customersRes, stocksRes, billsRes] = await Promise.all([
          fetch(`${BACKEND_SERVER_URL}/api/customers`),
          fetch(`${BACKEND_SERVER_URL}/api/v1/stocks`),
          fetch(`${BACKEND_SERVER_URL}/api/bills`),
        ]);

        const [customersData, stocksData, billsData] = await Promise.all([
          customersRes.json(),
          stocksRes.json(),
          billsRes.json(),
        ]);

        setCustomers(customersData);
        setStockData(stocksData);

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
    if (billItems.length > 0) {
      const totalPurity = billItems.reduce(
        (sum, item) => sum + parseFloat(item.purity || 0),
        0
      );
      const totalAmount = billItems.reduce((sum, item) => {
        const itemGoldRate = parseFloat(item.goldRate);
        if (!isNaN(itemGoldRate) && itemGoldRate > 0) {
          return sum + itemGoldRate * (parseFloat(item.purity) || 0);
        }
        return sum;
      }, 0);

      setPureBalance(totalPurity.toFixed(3));
      setTotalBalance(
        (parseFloat(totalAmount) + parseFloat(hallmarkCharges || 0)).toFixed(2)
      );
    } else {
      setPureBalance(0);
      setTotalBalance(0);
    }
  }, [billItems, hallmarkCharges]);

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

  useEffect(() => {
    if (viewMode && selectedBill) {
      setDisplayHallmarkCharges(selectedBill.hallmarkCharges || 0);
    } else if (!selectedBill && !viewMode) {
      setDisplayHallmarkCharges(0);
      setHallmarkCharges(0);
    }
  }, [viewMode, selectedBill]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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

  const addStockForBill = async (items) => {
    try {
      const results = await Promise.allSettled(
        items.map(async (item) => {
          const response = await fetch(
            `${BACKEND_SERVER_URL}/api/v1/stocks/add`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                coinType: item.percentage.toString(),
                gram: item.coinValue.toString(),
                quantity: item.quantity.toString(),
                reason: `Deleted the bill which contains(${item.coinValue}g ${item.percentage})`,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to add stock");
          }
          return response.json();
        })
      );

      return results.map((r) => r.value);
    } catch (error) {
      console.error("Stock adding error:", error);
      throw error;
    }
  };

  const deleteBill = async (bill) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete bill? This action deletes all the associated bill items and received entries.`
    );

    if (!confirmed) return;
    try {
      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/bills/${bill.id}`,
        {
          method: "DELETE",
        }
      );

      const items = bill.items.map((item) => ({
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
      }));

      if (response.ok) {
        await addStockForBill(items);
        showSnackbar("Bill deleted successfully", "success");
        setViewMode(false);
      } else {
        throw new Error("Deletion failed");
      }
    } catch (error) {
      console.error("Error deleting bills:", error);
      showSnackbar("Failed to delete bills", "error");
    }
  };

  const viewBill = (bill) => {
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
        paidAmount: detail.paidAmount?.toString(),
        mode: detail.amount ? "amount" : "weight",
      }))
    );

    setBillNo(`BILL-${bill.id}`);
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
        mode: "",
        paidAmount: "",
      },
    ]);
    setSelectedCustomer(null);
    setGoldRate("");
    setHallmarkCharges(0);
    setSelectedBill(null);
    setViewMode(false);
    setIsSubmitting(false);
    setIsUpdating(false);
    setDisplayHallmarkCharges(0);

    const newBillNo = latestBill
      ? `BILL-${parseInt(latestBill.id) + 1}`
      : "BILL-1";
    setBillNo(newBillNo);
  };

  const handlePrint = async () => {
    const input = billRef.current;

    const elementsToHide = [
      document.querySelector(".searchSection"),
      document.querySelector(".customerDetails"),
      document.querySelector(".sidebar"),
      ...Array.from(document.querySelectorAll(".no-print-receive")),
      ...Array.from(document.querySelectorAll(".no-prints-receive")),
      ...Array.from(document.querySelectorAll(".no-print-bill")),
      ...Array.from(document.querySelectorAll(".no-prints-bill")),
      document
        .querySelector(
          'p > .MuiIconButton-root svg[data-testid="AddCircleOutlineIcon"]'
        )
        ?.closest("p"),
    ];

    const originalValues = new Map();

    const dateTimeDiv = document.querySelector(".cus-info");
    if (dateTimeDiv && selectedCustomer) {
      const customerElement = document.createElement("strong");
      customerElement.className = "customer";
      customerElement.textContent = `Customer: ${selectedCustomer.name}`;

      originalValues.set(dateTimeDiv, {
        innerHTML: dateTimeDiv.innerHTML,
        element: customerElement,
      });

      dateTimeDiv.querySelector("p").innerHTML += `<br/><br/>`;
      dateTimeDiv.querySelector("p").appendChild(customerElement);
    }

    const originalFontSizes = new Map();

    const increaseFontSizeByPercent = (selector, percent) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (!originalFontSizes.has(el)) {
          const currentSize = window.getComputedStyle(el).fontSize;
          originalFontSizes.set(el, currentSize);
        }

        const numericSize = parseFloat(window.getComputedStyle(el).fontSize);
        const newSize = numericSize * (percent / 100 + 1);
        el.style.setProperty("font-size", `${newSize}px`, "important");
      });
    };

    increaseFontSizeByPercent(".td", 20);
    increaseFontSizeByPercent(".th", 25);
    increaseFontSizeByPercent("input", 20);

    elementsToHide.forEach((el) => {
      if (el) el.style.display = "none";
    });

    const restoreOriginalFontSizes = () => {
      originalFontSizes.forEach((size, el) => {
        if (el) {
          el.style.setProperty("font-size", size, "important");
        }
      });
    };

    try {
      const canvas = await html2canvas(input, {
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        scrollY: -window.scrollY,
      });

      elementsToHide.forEach((el) => {
        if (el) el.style.display = "";
      });

      originalValues.forEach((value, el) => {
        if (el) {
          if (value.innerHTML !== undefined) {
            el.innerHTML = value.innerHTML;
          } else {
            el.style.display = value.display;
          }
        }
      });

      restoreOriginalFontSizes();

      const imgData = canvas.toDataURL("image/png");
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          document.body.removeChild(iframe);
        }, 100);
      };

      iframe.srcdoc = `
      <html>
        <head>
          <title>Print Bill</title>
          <style>
            body { margin: 0; padding: 0; }
            img { width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <img src="${imgData}" />
        </body>
      </html>
    `;

      document.body.appendChild(iframe);
    } catch (error) {
      console.error("Printing error:", error);

      originalValues.forEach((value, el) => {
        if (el) {
          if (value.innerHTML !== undefined) {
            el.innerHTML = value.innerHTML;
          } else {
            el.style.display = value.display;
          }
        }
      });

      elementsToHide.forEach((el) => {
        if (el) el.style.display = "";
      });

      restoreOriginalFontSizes();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "p") {
        event.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

      const totalFromRows = rows.reduce((total, row) => {
        const amount = parseFloat(row.amount);

        if (!isNaN(amount)) {
          return total + amount;
        }

        return total;
      }, 0);

      let hallbalance = 0;

      if (totalFromRows >= hallmarkCharges) {
        hallbalance = 0;
      } else {
        hallbalance = hallmarkCharges - totalFromRows;
      }

      const totalAmount = totalAmountCalc + parseFloat(hallmarkCharges || 0);

      const billData = {
        customerId: selectedCustomer.id,
        goldRate: parseFloat(goldRate),
        hallmarkCharges: parseFloat(displayHallmarkCharges || 0),
        hallmarkBalance: hallbalance,
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
          paidAmount: parseFloat(row.paidAmount || 0),
        })),
      };

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

  const handleUpdateBill = async () => {
    if (!selectedBill || !selectedCustomer) {
      showSnackbar("Invalid bill data", "error");
      return;
    }

    try {
      const updatedBill = {
        ...selectedBill,
        hallmarkBalance: parseFloat(hallmarkCharges || 0),
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
            paidAmount: parseFloat(row.paidAmount || 0),
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

  const handleHallmarkChange = (e) => {
    const rawValue = e.target.value;

    const sanitizedValue = rawValue.replace(/[^0-9.]/g, "");

    const decimalParts = sanitizedValue.split(".");
    if (decimalParts.length > 2) {
      const validValue = decimalParts[0] + "." + decimalParts[1];
      setDisplayHallmarkCharges(validValue);
      setHallmarkCharges(parseFloat(validValue));
      return;
    }

    if (sanitizedValue === "" || sanitizedValue === ".") {
      setDisplayHallmarkCharges("");
      setHallmarkCharges(0);
      return;
    }

    setDisplayHallmarkCharges(sanitizedValue);

    const numberValue = parseFloat(sanitizedValue);
    if (!isNaN(numberValue)) {
      setHallmarkCharges(numberValue);
    }
  };

  return (
    <>
      <Box className="sidebar">
        <Tooltip title="Add Bill Details" arrow placement="right">
          <div className="sidebar-button" onClick={() => setOpenAddItem(true)}>
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

        <Tooltip
          title={viewMode ? "Disabled in view mode" : "Reset Bill"}
          arrow
          placement="right"
        >
          <div
            className="sidebar-button"
            onClick={() => {
              if (!viewMode) resetForm();
            }}
            style={{
              pointerEvents: viewMode ? "none" : "auto",
              opacity: viewMode ? 0.5 : 1,
              cursor: viewMode ? "not-allowed" : "pointer",
            }}
          >
            <span>Reset</span>
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
                opacity: isUpdating ? 1 : 0.5,
                pointerEvents: isUpdating ? "auto" : "none",
              }}
            >
              <span>Update</span>
            </div>
          </Tooltip>
        )}

        <Tooltip title="Delete Bill" arrow placement="right">
          <div
            className="sidebar-button"
            onClick={() => selectedBill && handleDeleteBill(selectedBill)}
            style={{ backgroundColor: "#ffebee" }}
          >
            <span style={{ color: "#c62828" }}>Delete</span>
          </div>
        </Tooltip>
      </Box>

      {viewMode && !selectedBill && (
        <ViewBill
          fetchedBills={fetchedBills}
          customers={customers}
          viewBill={viewBill}
          deleteBill={deleteBill}
          setViewMode={setViewMode}
        />
      )}

      {(!viewMode || selectedBill) && (
        <Box className="container" ref={billRef}>
          <h1 className="heading">Estimate Only</h1>

          <Box className="billInfo">
            <div className="cus-info">
              <p>
                <strong>Bill No:</strong> {viewMode ? selectedBill.id : billNo}{" "}
                <br /> <br />
                <strong className="customer"></strong>
              </p>
            </div>

            {viewMode ? (
              <p className="date-time">
                {(() => {
                  const createdDate = new Date(selectedBill.createdAt);

                  const date = createdDate
                    .toLocaleDateString("en-GB")
                    .replace(/\//g, "-");

                  const time = createdDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });

                  return (
                    <>
                      <strong>Date:</strong> {date} <br />
                      <br />
                      <strong>Time:</strong> {time}
                    </>
                  );
                })()}
              </p>
            ) : (
              <p className="date-time">
                <strong>Date:</strong> {date} <br />
                <br />
                <strong>Time:</strong> {time}
              </p>
            )}
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

          <BillDetails
            billItems={billItems}
            setBillItems={setBillItems}
            totalWeight={calculateTotals().totalWeight}
            totalPurity={calculateTotals().totalPurity}
            totalAmount={calculateTotals().totalAmount}
            displayHallmarkCharges={displayHallmarkCharges}
            handleHallmarkChange={handleHallmarkChange}
            viewMode={viewMode}
            selectedBill={selectedBill}
            openAddItem={openAddItem}
            setOpenAddItem={setOpenAddItem}
            stockData={stockData}
            showSnackbar={showSnackbar}
          />

          <ReceivedDetails
            rows={rows}
            setRows={setRows}
            initialPureBalance={pureBalance}
            initialTotalBalance={totalBalance}
            displayHallmarkCharges={displayHallmarkCharges}
            initialHallmarkBalance={hallmarkCharges}
            setPureBalance={setPureBalance}
            setTotalBalance={setTotalBalance}
            isViewMode={viewMode && selectedBill}
            setIsUpdating={setIsUpdating}
            displayedTotalBalance={calculateTotals().totalAmount}
          />
        </Box>
      )}

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
