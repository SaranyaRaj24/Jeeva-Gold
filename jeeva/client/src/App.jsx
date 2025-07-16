
import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./components/Home/Home";
import Customer from "./components/Customer/Customer";
import Goldsmith from "./components/Goldsmith/Goldsmith";
import Billing from "./components/Billing/Billing";
import Report from "./components/Report/Report";
import Stock from "./components/Stock/Stock";
import Navbar from "./components/Navbar/Navbar";
import Master from "./components/Master/Master";
import MasterCustomer from "./components/Master/Mastercustomer";
import Customertrans from "./components/Customer/Customertrans";
import Jobcard from "./components/Goldsmith/Jobcard";
import AddCustomer from "./components/Billing/Addcustomer";
import Register from "./components/Home/Register";
import CustomerReport from "./components/Report/customer.report";
import Overallreport from "./components/Report/overallreport";
import Jobcardreport from "./components/Report/jobcardreport";
import ProtectedRoutes from "../src/ProtectedRoutes/protected.routes";
import Advancereport from "./components/Report/Advancereport";
import BalanceReport from "./components/Report/BalanceReport";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/customer"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Customer />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/goldsmith"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Goldsmith />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/coinbill"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Billing />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Report />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/customerreport"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <CustomerReport />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/overallreport"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Overallreport />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/advancereport"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Advancereport/>
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />

         <Route
          path="/balancereport"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <BalanceReport/>
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />

        <Route
          path="/jobcardreport"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Jobcardreport />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Stock />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/customertrans"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Customertrans />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/jobcard/:id/:name"
          element={
            <ProtectedRoutes>
              <PageWithNavbar>
                <Jobcard />
              </PageWithNavbar>
            </ProtectedRoutes>
          }
        />

        <Route path="/master" element={<Master />} />
        <Route path="/mastercustomer" element={<MasterCustomer />} />
        <Route path="/addcustomer" element={<AddCustomer />} />
      </Routes>
    </BrowserRouter>
  );
}

function PageWithNavbar({ children }) {
  const location = useLocation();

  const hideNavbarPaths = ["/", "/register"];

  if (hideNavbarPaths.includes(location.pathname)) {
    return children;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default App;










