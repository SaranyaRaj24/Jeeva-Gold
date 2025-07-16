
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiChevronDown, FiChevronUp } from "react-icons/fi";

function Navbar() {
  const navigate = useNavigate();
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const userRole = localStorage.getItem("userRole");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/";
  };

  const toggleReportsDropdown = () => {
    setShowReportsDropdown(!showReportsDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowReportsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav style={navbarStyle} ref={dropdownRef}>
      <ul style={navListStyle}>
        {userRole !== "user" && (
          <>
            <li style={navItemStyle}>
              <a href="/master" style={linkStyle}>
                Master
              </a>
            </li>
            <li style={navItemStyle}>
              <a href="/customer" style={linkStyle}>
                Customer
              </a>
            </li>
            {/* 
            <li style={navItemStyle}>
              <a href="/goldsmith" style={linkStyle}>
                Gold Smith
              </a>
            </li>
            */}
          </>
        )}

        <li style={navItemStyle}>
          <a href="/stock" style={linkStyle}>
            Coin Stock
          </a>
        </li>

        <li style={navItemStyle}>
          <a href="/coinbill" style={linkStyle}>
            Coin Bill
          </a>
        </li>

        {userRole !== "user" && (
          <li style={navItemStyle}>
            <div style={dropdownHeaderStyle} onClick={toggleReportsDropdown}>
              Reports{" "}
              {showReportsDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showReportsDropdown && (
              <div style={dropdownMenuStyle}>
                <a
                  href="/report"
                  style={dropdownItemStyle}
                  className="dropdown-item"
                >
                  Daily Sales Report
                </a>
                <a
                  href="/customerreport"
                  style={dropdownItemStyle}
                  className="dropdown-item"
                >
                  Customer Report
                </a>
                <a
                  href="/advancereport"
                  style={dropdownItemStyle}
                  className="dropdown-item"
                >
                  Advance Payments Report
                </a>
                 <a
                  href="/balancereport"
                  style={dropdownItemStyle}
                  className="dropdown-item"
                >
                  Balance Report
                </a>
                <a
                  href="/overallreport"
                  style={dropdownItemStyle}
                  className="dropdown-item"
                >
                  Overall Report
                </a>
                {/* 
                <a href="/jobcardreport" style={dropdownItemStyle} className="dropdown-item">
                  Jobcard Report
                </a> 
                */}
              </div>
            )}
          </li>
        )}
      </ul>

      <button onClick={handleLogout} style={logoutButtonStyle} title="Logout">
        <FiLogOut size={20} />
      </button>

      <style>
        {`
          .dropdown-item:hover {
            background-color: black;
            cursor: pointer;
          }
        `}
      </style>
    </nav>
  );
}

const navbarStyle = {
  background: "#A31D1D",
  padding: "10px 0",
  width: "100%",
  boxSizing: "border-box",
  position: "relative",
};

const navListStyle = {
  listStyle: "none",
  display: "flex",
  justifyContent: "center",
  margin: 0,
  padding: 13,
};

const navItemStyle = {
  margin: "0 15px",
  position: "relative",
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "8px 12px",
  borderRadius: "4px",
  transition: "background-color 0.3s ease",
  display: "block",
};

const dropdownHeaderStyle = {
  ...linkStyle,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "5px",
};

const dropdownMenuStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  backgroundColor: "#A31D1D",
  minWidth: "200px",
  borderRadius: "4px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  zIndex: 1000,
};

const dropdownItemStyle = {
  color: "white",
  textDecoration: "none",
  padding: "10px 15px",
  whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  display: "block",
  transition: "background-color 0.3s ease",
};

const logoutButtonStyle = {
  backgroundColor: "#A31D1D",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "4px",
  position: "absolute",
  right: "10px",
  top: "10px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "5px",
};

export default Navbar;
