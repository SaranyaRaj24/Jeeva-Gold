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
  TablePagination,
} from "@mui/material";
import { BACKEND_SERVER_URL } from "../../Config/Config";

const DailySalesReport = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch(
          `${BACKEND_SERVER_URL}/api/bills?_embed=receivedDetails`
        );
        const data = await response.json();
        setBills(data);
        setFilteredBills(data);
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
    };

    fetchBills();
  }, []);

  useEffect(() => {
    if (date) {
      const filtered = bills.filter(
        (bill) =>
          new Date(bill.createdAt).toDateString() ===
          new Date(date).toDateString()
      );
      setFilteredBills(filtered);
    } else {
      setFilteredBills(bills);
    }
    setPage(0);
  }, [date, bills]);


  const calculateMetrics = () => {
    return filteredBills.reduce(
      (acc, bill) => {
       
        const billTotal =
          bill.items.reduce(
            (sum, item) => sum + item.purity * bill.goldRate,
            0
          ) + (bill.hallmarkCharges || 0);

      
        const received = bill.receivedDetails?.reduce(
          (sum, detail) => ({
            pure: sum.pure + (detail.purityWeight || 0),
            cash: sum.cash + (detail.amount || 0),
            hallmark: sum.hallmark + (detail.hallmark || 0),
          }),
          { pure: 0, cash: 0, hallmark: 0 }
        ) || { pure: 0, cash: 0, hallmark: 0 };

       
        const pureBalance =
          bill.items.reduce((sum, item) => sum + item.purity, 0) -
          received.pure;
        const cashBalance = billTotal - received.cash;
        const hallmarkBalance = (bill.hallmarkCharges || 0) - received.hallmark;

        return {
          totalSales: acc.totalSales + billTotal,
          totalWeight:
            acc.totalWeight +
            bill.items.reduce((sum, item) => sum + item.weight, 0),
          totalPurity:
            acc.totalPurity +
            bill.items.reduce((sum, item) => sum + item.purity, 0),
          pureReceived: acc.pureReceived + received.pure,
          cashReceived: acc.cashReceived + received.cash,
          cashPaid: acc.cashPaid, 
          outstandingPure:
            acc.outstandingPure + (pureBalance > 0 ? pureBalance : 0),
          outstandingCash:
            acc.outstandingCash + (cashBalance > 0 ? cashBalance : 0),
          outstandingHallmark:
            acc.outstandingHallmark +
            (hallmarkBalance > 0 ? hallmarkBalance : 0),
        };
      },
      {
        totalSales: 0,
        totalWeight: 0,
        totalPurity: 0,
        pureReceived: 0,
        cashReceived: 0,
        cashPaid: 0,
        outstandingPure: 0,
        outstandingCash: 0,
        outstandingHallmark: 0,
      }
    );
  };

  const metrics = calculateMetrics();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleReset = () => {
    setDate("");
    setFilteredBills(bills);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography style={{ textAlign: "center" }} variant="h5" gutterBottom>
        Daily Sales Report
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Select Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />

        <Button variant="outlined" onClick={handleReset}>
          Show All
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          mb: 3,
          alignItems: "center",
          bgcolor: "#f5f5f5",
          p: 2,
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Total Sales: ₹{metrics.totalSales.toFixed(2)}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Total Weight: {metrics.totalWeight.toFixed(3)} g
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Total Purity: {metrics.totalPurity.toFixed(3)} g
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Pure Received: {metrics.pureReceived.toFixed(3)} g
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Cash Received: ₹{metrics.cashReceived.toFixed(2)}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Outstanding Cash: ₹{metrics.outstandingCash.toFixed(2)}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Number of Bills: {filteredBills.length}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill No</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Total Weight</TableCell>
              <TableCell>Total Purity</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Cash Received</TableCell>
              <TableCell>Pure Received</TableCell>
              <TableCell>Cash Balance</TableCell>
              <TableCell>Pure Balance</TableCell>
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
                const totalAmount =
                  bill.items.reduce(
                    (sum, item) => sum + item.purity * bill.goldRate,
                    0
                  ) + (bill.hallmarkCharges || 0);

                const received = bill.receivedDetails?.reduce(
                  (sum, detail) => ({
                    cash: sum.cash + (detail.amount || 0),
                    pure: sum.pure + (detail.purityWeight || 0),
                  }),
                  { cash: 0, pure: 0 }
                ) || { cash: 0, pure: 0 };

                const cashBalance = totalAmount - received.cash;
                const pureBalance = totalPurity - received.pure;

                return (
                  <TableRow key={bill.id}>
                    <TableCell>BILL-{bill.id}</TableCell>
                    <TableCell>{bill.customerId || "Unknown"}</TableCell>
                    <TableCell>{totalWeight.toFixed(3)}</TableCell>
                    <TableCell>{totalPurity.toFixed(3)}</TableCell>
                    <TableCell>₹{totalAmount.toFixed(2)}</TableCell>
                    <TableCell>₹{received.cash.toFixed(2)}</TableCell>
                    <TableCell>{received.pure.toFixed(3)} g</TableCell>
                    <TableCell
                      sx={{
                        color: cashBalance > 0 ? "error.main" : "success.main",
                      }}
                    >
                      ₹{cashBalance.toFixed(2)}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: pureBalance > 0 ? "error.main" : "success.main",
                      }}
                    >
                      {pureBalance.toFixed(3)} g
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
    </Box>
  );
};

export default DailySalesReport;
