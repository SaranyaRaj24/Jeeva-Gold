
import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import "./Goldsmith.css";
import { useNavigate } from "react-router-dom";
import { BACKEND_SERVER_URL } from "../../Config/Config";

const Goldsmith = () => {
  const [goldsmith, setGoldsmith] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGoldsmiths = async () => {
      try {
        const response = await fetch(`${BACKEND_SERVER_URL}/api/goldsmith`);
        const data = await response.json();
        setGoldsmith(data);
      } catch (error) {
        console.error("Error fetching goldsmith data:", error);
      }
    };
    fetchGoldsmiths();
  }, []);

  const filteredGoldsmith = goldsmith.filter((gs) => {
    const nameMatch =
      gs.name && gs.name.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = gs.phone && gs.phone.includes(searchTerm);
    const addressMatch =
      gs.address && gs.address.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || phoneMatch || addressMatch;
  });

  return (
    <Container maxWidth="md">
      <Paper className="customer-details-container" elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Goldsmith Details
        </Typography>

        <TextField
          label="Search Goldsmith Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "30px",
              width: "18rem",
              backgroundColor: "#f8f9fa",
              "&.Mui-focused": {
                backgroundColor: "#ffffff",
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon style={{ color: "#777" }} />
              </InputAdornment>
            ),
          }}
        />

        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">
                <strong>Goldsmith Name</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Phone Number</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Address</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Status</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGoldsmith.length > 0 ? (
              filteredGoldsmith.map((goldsmith, index) => (
                <TableRow key={index}>
                  <TableCell>{goldsmith.name}</TableCell>
                  <TableCell>{goldsmith.phone}</TableCell>
                  <TableCell>{goldsmith.address}</TableCell>
                  <TableCell>
                    <VisibilityIcon
                      onClick={() =>
                        navigate(
                          `/jobcard/${goldsmith.id}/${goldsmith.name}`,
                          {
                            state: {
                              goldsmithId:goldsmith.id,
                              goldsmithName: goldsmith.name,
                              goldsmithPhone: goldsmith.phone,
                              goldsmithAddress: goldsmith.address,
                            },
                          }
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No goldsmith details available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default Goldsmith;