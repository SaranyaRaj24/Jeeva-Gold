const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createTransaction = async (req, res) => {
  try {
    const { date, type, value, touch, purity, customerId, goldRate } = req.body;

    if (!date || !type || !value || !customerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        type,
        value: parseFloat(value),
        goldRate: type === "Cash" ? parseFloat(goldRate) : null,
        purity: parseFloat(purity),
        touch: type === "Gold" ? parseFloat(touch) : null,
        customer: {
          connect: {
            id: parseInt(customerId),
          },
        },
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const getAllTransactions = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { customerId: parseInt(customerId) },
      orderBy: { date: "desc" },
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    const transaction = await prisma.transaction.delete({
      where: {
        id: parseInt(id),
      },
    });

    res
      .status(200)
      .json({ message: "Transaction deleted successfully", transaction });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, value, touch, purity, customerId, goldRate } = req.body;

    if (!id || !date || !type || !value || !customerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: parseInt(id),
      },
      data: {
        date: new Date(date),
        type,
        value: parseFloat(value),
        goldRate: type === "Cash" ? parseFloat(goldRate) : null,
        purity: parseFloat(purity),
        touch: type === "Gold" ? parseFloat(touch) : null,
        customer: {
          connect: {
            id: parseInt(customerId),
          },
        },
      },
    });

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const getAllTransactionsForAllCustomers = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      include: {
        customer: true, 
      },
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {
  createTransaction,
  getAllTransactions,
  deleteTransaction,
  updateTransaction,
getAllTransactionsForAllCustomers
};
