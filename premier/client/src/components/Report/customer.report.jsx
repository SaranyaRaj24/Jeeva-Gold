
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Autocomplete,
  TablePagination,
  IconButton,
  Modal,
  Alert,
} from "@mui/material";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import VisibilityIcon from "@mui/icons-material/Visibility";

const CustomerReport = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBill, setSelectedBill] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate();
    setEndDate();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${BACKEND_SERVER_URL}/api/customers`);
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    const fetchBills = async () => {
      try {
        const response = await fetch(`${BACKEND_SERVER_URL}/api/bills`);
        const data = await response.json();
        setBills(data);
        setFilteredBills(data); 
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
    };

    fetchCustomers();
    fetchBills();
  }, []); 

  useEffect(() => {
    let result = bills;

    if (selectedCustomer) {
      result = result.filter((bill) => bill.customerId === selectedCustomer.id);
      calculateBalances(selectedCustomer.id);
    } else {
    
      setOpeningBalance(0);
      setClosingBalance(0);
    }

    if (startDate) {
      result = result.filter(
        (bill) => new Date(bill.createdAt) >= new Date(startDate)
      );
    }

    if (endDate) {
      result = result.filter(
        (bill) => new Date(bill.createdAt) <= new Date(endDate + "T23:59:59")
      );
    }

    setFilteredBills(result);
    setPage(0);
  }, [selectedCustomer, startDate, endDate, bills]); 

  const calculateBalances = (customerId) => {
    const openingBills = bills.filter(
      (bill) =>
        bill.customerId === customerId &&
        (startDate ? new Date(bill.createdAt) < new Date(startDate) : false)
    );

    const opening = openingBills.reduce((total, bill) => {
      const billTotal = bill.items.reduce(
        (sum, item) => sum + item.purity * bill.goldRate,
        0
      );
      return total + billTotal + (bill.hallmarkCharges || 0);
    }, 0);

    setOpeningBalance(opening);

    const filtered = bills.filter(
      (bill) =>
        bill.customerId === customerId &&
        (startDate ? new Date(bill.createdAt) >= new Date(startDate) : true) &&
        (endDate
          ? new Date(bill.createdAt) <= new Date(endDate + "T23:59:59")
          : true)
    );

    const closing = filtered.reduce((total, bill) => {
      const billTotal = bill.items.reduce(
        (sum, item) => sum + item.purity * bill.goldRate,
        0
      );
      return total + billTotal + (bill.hallmarkCharges || 0);
    }, opening);

    setClosingBalance(closing);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const calculateTotal = (bills) => {
    return bills.reduce((total, bill) => {
      const billTotal = bill.items.reduce(
        (sum, item) => sum + item.purity * bill.goldRate,
        0
      );
      return total + billTotal + (bill.hallmarkCharges || 0);
    }, 0);
  };

  const calculateWeight = (bills) => {
    return bills.reduce(
      (total, bill) =>
        total + bill.items.reduce((sum, item) => sum + item.weight, 0),
      0
    );
  };

  const calculatePurity = (bills) => {
    return bills.reduce(
      (total, bill) =>
        total + bill.items.reduce((sum, item) => sum + item.purity, 0),
      0
    );
  };

  const handleReset = () => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedCustomer(null);
    setStartDate(today);
    setEndDate(today);
    setFilteredBills(bills); 
    setOpeningBalance(0);
    setClosingBalance(0);
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setViewModalOpen(false);
    setSelectedBill(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography style={{ textAlign: "center" }} variant="h5" gutterBottom>
        Customer Report
      </Typography>
      <br />
      <br />

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Autocomplete
          options={customers}
          getOptionLabel={(option) => option.name}
          value={selectedCustomer}
          onChange={(event, newValue) => setSelectedCustomer(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Select Customer" variant="outlined" />
          )}
          sx={{ minWidth: 300 }}
        />

        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />

        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />

        <Button variant="outlined" onClick={handleReset}>
          Reset
        </Button>
      </Box>

      {selectedCustomer && (
        <Box
          sx={{
            display: "flex",
            gap: 4,
            mb: 2,
            flexWrap: "wrap",
            fontWeight: "bold",
          }}
        >
          <Typography variant="body1">
            Opening Balance: ₹{openingBalance.toFixed(2)}
          </Typography>
          <Typography variant="body1">
            Closing Balance: ₹{closingBalance.toFixed(2)}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 4,
          mb: 2,
          flexWrap: "wrap",
          fontWeight: "bold",
        }}
      >
        <Typography variant="body1">
          Total Sales: ₹{calculateTotal(filteredBills).toFixed(2)}
        </Typography>
        <Typography variant="body1">
          Total Weight: {calculateWeight(filteredBills).toFixed(3)} g
        </Typography>
        <Typography variant="body1">
          Total Purity: {calculatePurity(filteredBills).toFixed(3)} g
        </Typography>
        <Typography variant="body1">
          Number of Bills: {filteredBills.length}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill No</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Gold Rate</TableCell>
              <TableCell>Total Weight</TableCell>
              <TableCell>Total Purity</TableCell>
              <TableCell>Hallmark Charges</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBills
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((bill) => {
                const totalWeight = bill.items.reduce(
                  (sum, item) => sum + item.weight,
                  0
                );
                const totalPurity = bill.items.reduce(
                  (sum, item) => sum + item.purity,
                  0
                );
                const totalAmount = bill.items.reduce(
                  (sum, item) => sum + item.purity * bill.goldRate,
                  0
                );

             
                const customer = customers.find(
                  (c) => c.id === bill.customerId
                );
                const customerName = customer ? customer.name : "Unknown";

                return (
                  <TableRow key={bill.id}>
                    <TableCell>BILL-{bill.id}</TableCell>
                    <TableCell>
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{customerName}</TableCell>{" "}
                    <TableCell>{bill.goldRate}</TableCell>
                    <TableCell>{totalWeight.toFixed(3)}</TableCell>
                    <TableCell>{totalPurity.toFixed(3)}</TableCell>
                    <TableCell>{bill.hallmarkCharges || 0}</TableCell>
                    <TableCell>
                      {(totalAmount + (bill.hallmarkCharges || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewBill(bill)}>
                        <VisibilityIcon color="primary" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredBills.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Modal open={viewModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {selectedBill && (
            <>
              <Typography variant="h6" gutterBottom>
                Bill Details - BILL-{selectedBill.id}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Date:</strong>{" "}
                  {new Date(selectedBill.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  <strong>Customer:</strong>{" "}
                  {customers.find((c) => c.id === selectedBill.customerId)
                    ?.name || "Unknown"}
                </Typography>
                <Typography variant="body1">
                  <strong>Gold Rate:</strong> {selectedBill.goldRate}
                </Typography>
              </Box>

              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Coin</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>%</TableCell>
                      <TableCell>Touch</TableCell>
                      <TableCell>Weight</TableCell>
                      <TableCell>Purity</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedBill.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.coinValue}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.percentage}</TableCell>
                        <TableCell>{item.touch}</TableCell>
                        <TableCell>{item.weight.toFixed(3)}</TableCell>
                        <TableCell>{item.purity.toFixed(3)}</TableCell>
                        <TableCell>
                          {(item.purity * selectedBill.goldRate).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4}>
                        <strong>Total</strong>
                      </TableCell>
                      <TableCell>
                        <strong>
                          {selectedBill.items
                            .reduce((sum, item) => sum + item.weight, 0)
                            .toFixed(3)}
                        </strong>
                      </TableCell>
                      <TableCell>
                        <strong>
                          {selectedBill.items
                            .reduce((sum, item) => sum + item.purity, 0)
                            .toFixed(3)}
                        </strong>
                      </TableCell>
                      <TableCell>
                        <strong>
                          {selectedBill.items
                            .reduce(
                              (sum, item) =>
                                sum + item.purity * selectedBill.goldRate,
                              0
                            )
                            .toFixed(2)}
                        </strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6}>
                        <strong>Hallmark or MC Charges</strong>
                      </TableCell>
                      <TableCell>
                        <strong>
                          {selectedBill.hallmarkCharges?.toFixed(2) || "0.00"}
                        </strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6}>
                        <strong>Total Amount</strong>
                      </TableCell>
                      <TableCell>
                        <strong>
                          {(
                            selectedBill.items.reduce(
                              (sum, item) =>
                                sum + item.purity * selectedBill.goldRate,
                              0
                            ) + (selectedBill.hallmarkCharges || 0)
                          ).toFixed(2)}
                        </strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {selectedBill.receivedDetails &&
                selectedBill.receivedDetails.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Received Details
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Gold Rate</TableCell>
                            <TableCell>Gold</TableCell>
                            <TableCell>Touch</TableCell>
                            <TableCell>Purity WT</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Hallmark</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedBill.receivedDetails.map((detail, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {detail.date ||
                                  new Date().toISOString().split("T")[0]}
                              </TableCell>
                              <TableCell>{detail.goldRate}</TableCell>
                              <TableCell>{detail.givenGold || "-"}</TableCell>
                              <TableCell>{detail.touch || "-"}</TableCell>
                              <TableCell>
                                {detail.purityWeight.toFixed(3)}
                              </TableCell>
                              <TableCell>{detail.amount.toFixed(2)}</TableCell>
                              <TableCell>{detail.hallmark || "0.00"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" onClick={handleCloseModal}>
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default CustomerReport;