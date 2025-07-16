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
  TablePagination,
  IconButton,
  Modal,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import VisibilityIcon from "@mui/icons-material/Visibility";

const BalanceReport = () => {
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [customerBalances, setCustomerBalances] = useState([]);
  const [ownerBalances, setOwnerBalances] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBill, setSelectedBill] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 for customer, 1 for owner

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, billsRes] = await Promise.all([
          fetch(`${BACKEND_SERVER_URL}/api/customers`),
          fetch(`${BACKEND_SERVER_URL}/api/bills`),
        ]);
        const customersData = await customersRes.json();
        const billsData = await billsRes.json();

        setCustomers(customersData);
        setBills(billsData);

        // Calculate balances
        calculateBalances(customersData, billsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const calculateBillBalance = (bill) => {
    if (!bill.receivedDetails || bill.receivedDetails.length === 0) {
      return bill.totalPurity; // No payments made yet
    }

    let receivedPurity = 0;

    bill.receivedDetails.forEach((detail) => {
      if (detail.paidAmount) {
        // Subtract purityWeight if paidAmount exists
        receivedPurity -= detail.purityWeight || 0;
      } else {
        // Add purityWeight if no paidAmount
        receivedPurity += detail.purityWeight || 0;
      }
    });

    return bill.totalPurity - receivedPurity;
  };

  const calculateBalances = (customersData, billsData) => {
    const customerBalances = [];
    const ownerBalances = [];

    customersData.forEach((customer) => {
      const customerBills = billsData.filter(
        (bill) => bill.customerId === customer.id
      );

      let customerOwed = 0;
      let ownerOwed = 0;
      const customerBillsWithBalance = [];
      const ownerBillsWithBalance = [];

      customerBills.forEach((bill) => {
        const balance = calculateBillBalance(bill);

        const balancefix = balance.toFixed(3);

        console.log("asgkfsasaaaaaaaaaaaaa", bill, balance);

        if (balancefix > 0) {
          customerOwed += balance;
          customerBillsWithBalance.push({
            ...bill,
            balance,
          });
        } else if (balancefix < 0) {
          ownerOwed += Math.abs(balance);
          ownerBillsWithBalance.push({
            ...bill,
            balance: Math.abs(balance),
          });
        }
      });

      if (customerOwed > 0) {
        customerBalances.push({
          customerId: customer.id,
          customerName: customer.name,
          balance: customerOwed,
          billsWithBalance: customerBillsWithBalance,
        });
      }

      if (ownerOwed > 0) {
        ownerBalances.push({
          customerId: customer.id,
          customerName: customer.name,
          balance: ownerOwed,
          billsWithBalance: ownerBillsWithBalance,
        });
      }
    });

    console.log(
      "sagkjlasaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      customerBalances,
      ownerBalances
    );

    setCustomerBalances(customerBalances);
    setOwnerBalances(ownerBalances);
  };

  const handleViewBills = (customerId, isCustomerOwed) => {
    const balances = isCustomerOwed ? customerBalances : ownerBalances;
    const customer = balances.find((c) => c.customerId === customerId);
    if (customer) {
      setFilteredBills(customer.billsWithBalance);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setViewModalOpen(false);
    setSelectedBill(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const totalCustomerOutstandingBalance = customerBalances.reduce(
    (sum, customer) => sum + customer.balance,
    0
  );
  const totalOwnerOutstandingBalance = ownerBalances.reduce(
    (sum, owner) => sum + owner.balance,
    0
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center" }}>
        Balance Report
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Customer Owes" />
        <Tab label="Owner Owes" />
      </Tabs>

      {activeTab === 0 ? (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Customers with Outstanding Balances
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
              Total Outstanding Balance:{" "}
              <strong>
                {totalCustomerOutstandingBalance.toFixed(3)} grams
              </strong>
            </Typography>
          </Box>

          {customerBalances.length > 0 ? (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer Name</TableCell>
                      <TableCell>Outstanding Purity (grams)</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerBalances
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((customer) => (
                        <TableRow key={customer.customerId}>
                          <TableCell>{customer.customerName}</TableCell>
                          <TableCell>{customer.balance.toFixed(3)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              onClick={() =>
                                handleViewBills(customer.customerId, true)
                              }
                            >
                              View Bills ({customer.billsWithBalance.length})
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={customerBalances.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          ) : (
            <Typography variant="body1" sx={{ mt: 2 }}>
              No customers with outstanding balances
            </Typography>
          )}
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Owner with Outstanding Balances
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
              Total Outstanding Balance:{" "}
              <strong>{totalOwnerOutstandingBalance.toFixed(3)} grams</strong>
            </Typography>
          </Box>

          {ownerBalances.length > 0 ? (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer Name</TableCell>
                      <TableCell>Owner Owes Purity (grams)</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ownerBalances
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((customer) => (
                        <TableRow key={customer.customerId}>
                          <TableCell>{customer.customerName}</TableCell>
                          <TableCell>{customer.balance.toFixed(3)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              onClick={() =>
                                handleViewBills(customer.customerId, false)
                              }
                            >
                              View Bills ({customer.billsWithBalance.length})
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={ownerBalances.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          ) : (
            <Typography variant="body1" sx={{ mt: 2 }}>
              No owner owes to customers
            </Typography>
          )}
        </>
      )}

      {filteredBills.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            {activeTab === 0
              ? "Bills with Customer Owes"
              : "Bills with Owner Owes"}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bill No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total Purity</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.billNo}</TableCell>
                    <TableCell>
                      {new Date(bill.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{bill.totalPurity.toFixed(3)}</TableCell>
                    <TableCell>
                      {activeTab === 0
                        ? `Customer owes: ${bill.balance?.toFixed(3)}`
                        : `Owner owes: ${bill.balance?.toFixed(3)}`}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewBill(bill)}>
                        <VisibilityIcon color="primary" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

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
                Bill Details - {selectedBill.billNo}
              </Typography>

              <Typography variant="body1">
                <strong>Customer:</strong>{" "}
                {selectedBill.customer?.name || "Unknown"}
              </Typography>
              <Typography variant="body1">
                <strong>Date:</strong>{" "}
                {new Date(selectedBill.date).toLocaleDateString()}
              </Typography>
              <Typography variant="body1">
                <strong>Total Purity:</strong>{" "}
                {selectedBill.totalPurity.toFixed(3)}g
              </Typography>
              <Typography
                variant="body1"
                color={
                  calculateBillBalance(selectedBill) > 0 ? "error" : "success"
                }
              >
                <strong>Balance:</strong>
                {calculateBillBalance(selectedBill) > 0
                  ? `Customer owes: ${calculateBillBalance(
                      selectedBill
                    ).toFixed(3)}g`
                  : `Owner owes: ${Math.abs(
                      calculateBillBalance(selectedBill)
                    ).toFixed(3)}g`}
              </Typography>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Items
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Coin</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Weight</TableCell>
                      <TableCell>Purity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedBill.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.coinValue}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.weight.toFixed(3)}</TableCell>
                        <TableCell>{item.purity.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Received Details
              </Typography>
              {selectedBill.receivedDetails?.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 1 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Purity Weight</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Paid Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedBill.receivedDetails.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(detail.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {detail.givenGold ? "Gold" : "Cash"}
                          </TableCell>
                          <TableCell>
                            {detail.purityWeight?.toFixed(3) || "-"}
                          </TableCell>
                          <TableCell>
                            {detail.amount?.toFixed(2) || "-"}
                          </TableCell>
                          <TableCell>
                            {detail.paidAmount?.toFixed(2) || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  No received details
                </Typography>
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

export default BalanceReport;
