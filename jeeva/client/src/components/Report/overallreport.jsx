import React, { useEffect, useState } from "react";
import "./overallreport.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";

const OverallReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setReportData([]);

    try {
      const [
        customersRes,
        billsRes,
        jewelRes,
        coinRes,
        entriesRes,
        expenseRes,
      ] = await Promise.all([
        fetch(`${BACKEND_SERVER_URL}/api/customers`),
        fetch(`${BACKEND_SERVER_URL}/api/bills`),
        fetch(`${BACKEND_SERVER_URL}/api/jewel-stock`),
        fetch(`${BACKEND_SERVER_URL}/api/v1/stocks`),
        fetch(`${BACKEND_SERVER_URL}/api/entries`),
        fetch(`${BACKEND_SERVER_URL}/api/expenses/summary`),
      ]);

      if (!customersRes.ok) throw new Error("Failed to fetch customers");
      if (!billsRes.ok) throw new Error("Failed to fetch bills");
      if (!jewelRes.ok) throw new Error("Failed to fetch jewel stock");
      if (!coinRes.ok) throw new Error("Failed to fetch coin stock");
      if (!entriesRes.ok) throw new Error("Failed to fetch entries");
      if (!expenseRes.ok) throw new Error("Failed to fetch expense summary");

      const [
        customers,
        bills,
        jewelData,
        coinData,
        entriesData,
        expenseSummary,
      ] = await Promise.all([
        customersRes.json(),
        billsRes.json(),
        jewelRes.json(),
        coinRes.json(),
        entriesRes.json(),
        expenseRes.json(),
      ]);

      let expenseCashOrGold = 0;
      let expenseAdvance = 0;

      expenseSummary.forEach((exp) => {
        if (exp.valueType === "CashOrGold") {
          expenseCashOrGold += parseFloat(exp._sum?.purity || 0);
        }
        if (exp.valueType === "Advance") {
          expenseAdvance += parseFloat(exp._sum?.purity || 0);
        }
      });

      const manualEntriesPurity = entriesData.reduce(
        (sum, entry) => sum + parseFloat(entry.purity || 0),
        0
      );

      let receivedEntriesPurity = 0;
      bills.forEach((bill) => {
        if (bill.receivedDetails && Array.isArray(bill.receivedDetails)) {
          bill.receivedDetails.forEach((detail) => {
            const purity = parseFloat(detail.purityWeight || 0);
            if (detail.paidAmount > 0) {
              receivedEntriesPurity -= purity;
            } else {
              receivedEntriesPurity += purity;
            }
          });
        }
      });

      const totalCashGoldEntriesPurity =
        manualEntriesPurity + receivedEntriesPurity;

      const totalJewelPurity = jewelData.reduce(
        (sum, item) => sum + parseFloat(item.purityValue || 0),
        0
      );

      const totalCoinPurity = coinData.reduce(
        (sum, item) => sum + parseFloat(item.purity || 0),
        0
      );

      let allTransactions = [];
      try {
        const transRes = await fetch(`${BACKEND_SERVER_URL}/api/transactions`);
        if (transRes.ok) {
          allTransactions = await transRes.json();
        } else {
          const customerTransactions = await Promise.all(
            customers.map((customer) =>
              fetch(`${BACKEND_SERVER_URL}/api/transactions/${customer.id}`)
                .then((res) => (res.ok ? res.json() : []))
                .catch(() => [])
            )
          );
          allTransactions = customerTransactions.flat();
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.warn("Could not load all transactions");
      }

      const advancesGold = allTransactions.reduce(
        (sum, t) => sum + parseFloat(t.purity || 0),
        0
      );

      const calculateTotalBalances = (bills) => {
        let totalCustomerBalance = 0;

        bills.forEach((bill) => {
          const totalPurity = parseFloat(bill.totalPurity || 0);

          let receivedPurity = 0;
          if (bill.receivedDetails && Array.isArray(bill.receivedDetails)) {
            bill.receivedDetails.forEach((detail) => {
              const purity = parseFloat(detail.purityWeight || 0);
              if (detail.paidAmount > 0) {
                receivedPurity -= purity;
              } else {
                receivedPurity += purity;
              }
            });
          }

          const balance = totalPurity - receivedPurity;

          if (balance.toFixed(3) > 0) {
            totalCustomerBalance += balance;
          }
        });

        return {
          totalCustomerBalance,
        };
      };

      const { totalCustomerBalance } = calculateTotalBalances(bills);

      const adjustedCashGoldEntriesPurity =
        totalCashGoldEntriesPurity - expenseCashOrGold;

      const adjustedAdvancesGold = advancesGold - expenseAdvance;

      const overallValue =
        totalCustomerBalance +
        adjustedCashGoldEntriesPurity +
        totalCoinPurity +
        totalJewelPurity -
        adjustedAdvancesGold;

      setReportData([
        {
          label: "Customer Balance",
          value: `${formatToFixed3Strict(totalCustomerBalance)}g`,
          tooltip:
            "Total sum of 'pureBalance' (i.e. totalPurity) across all saved bills",
        },
        {
          label: "Cash/Gold (Entries Purity)",
          value: `${formatToFixed3Strict(adjustedCashGoldEntriesPurity)}g`,
          tooltip: `Total gold purity from all manual Cash/Gold entries in the system (Sum of manual entries ${formatToFixed3Strict(
            manualEntriesPurity
          )}g and received bill entries ${formatToFixed3Strict(
            receivedEntriesPurity
          )}g)`,
        },
        {
          label: "Coin Stock",
          value: ` ${formatToFixed3Strict(totalCoinPurity)}g Purity (${
            coinData.length
          } Coins)`,
          tooltip: "Current coin inventory with total purity",
        },
        {
          label: "Jewel Stock",
          value: ` ${formatToFixed3Strict(totalJewelPurity)}g Purity (${
            jewelData.length
          } Items)`,
          tooltip: "Current jewel inventory with total purity",
        },
        {
          label: "Advances in Gold (Purity)",
          value: `${formatToFixed3Strict(adjustedAdvancesGold)}g`,
          tooltip:
            "Total gold purity equivalent from all customer advance transactions",
        },
        {
          label: "Overall Value",
          value: `${formatToFixed3Strict(overallValue)} g`,
          tooltip: "Pure Balance + Cash/Gold + Coin + Jewel - Advances in Gold",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      toast.error(`Error: ${error.message}`);
      setReportData([
        {
          label: "Error",
          value: "Could not load report data",
          tooltip: error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overall-report-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="report-header">
        <h2>Overall Report</h2>
      </div>

      {reportData.length > 0 && (
        <div className="report-cards-container">
          <div className="report-column report-left">
            {reportData.slice(0, 5).map((item, index) => (
              <div key={index} className="report-card" title={item.tooltip}>
                <div className="card-label">{item.label}</div>
                <div className="card-value">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="report-column report-right">
            {reportData.slice(5).map((item, index) => (
              <div key={index + 5} className="report-card" title={item.tooltip}>
                <div className="card-label">{item.label}</div>
                <div className="card-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallReport;
