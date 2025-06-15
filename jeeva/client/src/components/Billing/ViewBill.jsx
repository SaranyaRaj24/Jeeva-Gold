import React from "react";
import {
  Box,
  Modal,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

const ViewBill = ({ fetchedBills, customers, viewBill, setViewMode }) => {
  return (
    <Modal
      open={true}
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="th">Bill No</TableCell>
              <TableCell className="th">Customer</TableCell>
              <TableCell className="th">Date</TableCell>
              <TableCell className="th">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fetchedBills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="td">BILL-{bill.id}</TableCell>
                <TableCell className="td">
                  {customers.find((c) => c.id === bill.customerId)?.name ||
                    "Unknown"}
                </TableCell>
                <TableCell className="td">
                  {new Date(bill.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="td">
                  <Button variant="outlined" onClick={() => viewBill(bill)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button
          onClick={() => setViewMode(false)}
          style={{ marginTop: "1rem" }}
          variant="contained"
        >
          Close
        </Button>
      </Box>
    </Modal>
  );
};

export default ViewBill;