import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import MasterCustomer from "./Mastercustomer";
import "./Master.css";
import Masterjewelstock from "./Masterjewelstock";
import Cashgold from "./Cashgold";
import { FiLogOut } from "react-icons/fi";
import Logo from "../../Assets/logo.png";

const Master = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <nav
        style={{
          backgroundColor: "#A31D1D",
          padding: "15px",
          color: "white",
          boxShadow: "0 2px 4px rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <img
            src={Logo}
            alt="Logo"
            style={{ height: "40px", marginRight: "20px" }}
          />

          <ul
            style={{
              listStyle: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <li>
              <button
                onClick={() => navigate("/customer")}
                className="nav-button"
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                Home
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate("/master/customer")}
                className={`nav-button ${
                  isActive("/master/customer") ? "active" : ""
                }`}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                Customer
              </button>
            </li>
            {/* <li style={{ marginRight: "20px" }}>
            <button
              onClick={handleAddGoldsmithClick}
              className="nav-button"
              onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
              onMouseOut={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }
            >
              Goldsmith
            </button>
          </li> */}
            {/* <li style={{ marginRight: "20px" }}>
            <button
              onClick={handleAddItemsClick}
              className="nav-button"
              onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
              onMouseOut={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }
            >
              Items
            </button>    
          </li> */}
            <li>
              <button
                onClick={() => navigate("/master/stock")}
                className={`nav-button ${
                  isActive("/master/stock") ? "active" : ""
                }`}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                Jewel Stock
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/master/cashgold")}
                className={`nav-button ${
                  isActive("/master/cashgold") ? "active" : ""
                }`}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                Cash / Gold
              </button>
            </li>
             <li>
              <button
                onClick={() => navigate("/master/expense")}
                className={`nav-button ${
                  isActive("/master/expense") ? "active" : ""
                }`}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                Expense
              </button>
            </li>
          </ul>
          <button
            onClick={handleLogout}
            style={logoutButtonStyle}
            title="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
};

const logoutButtonStyle = {
  backgroundColor: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
};

export default Master;
