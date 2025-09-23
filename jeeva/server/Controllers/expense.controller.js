const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createExpense = async (req, res) => {
  const { date, valueType, purity, remarks } = req.body;

  if (!date || !valueType) {
    return res.status(400).json({
      message: "Date and value type are required.",
    });
  }

  try {
    const newExpense = await prisma.expense.create({
      data: {
        date: new Date(date),
        valueType: valueType === "cash/gold" ? "CashOrGold" : "Advance",
        purity: purity ? parseFloat(purity) : 0,
        remarks: remarks || null,
      },
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ message: "Expense constraint violation." });
    }

    res.status(500).json({
      message: "Error creating expense",
      error: error.message,
    });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      message: "Error fetching expenses",
      error: error.message,
    });
  }
};

exports.getExpenseById = async (req, res) => {
  const { id } = req.params;

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({
      message: "Error fetching expense",
      error: error.message,
    });
  }
};

exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const { date, valueType, purity, remarks } = req.body;

  try {
    const existingExpense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        date: date ? new Date(date) : existingExpense.date,
        valueType: valueType === "cash/gold" ? "CashOrGold" : "Advance" || existingExpense.valueType,
        purity:
          purity !== undefined ? parseFloat(purity) : existingExpense.purity,
        remarks: remarks !== undefined ? remarks : existingExpense.remarks,
      },
    });

    res.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.status(500).json({
      message: "Error updating expense",
      error: error.message,
    });
  }
};

exports.deleteExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const existingExpense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Error deleting expense:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.status(500).json({
      message: "Error deleting expense",
      error: error.message,
    });
  }
};

exports.getExpenseSummary = async (req, res) => {
  try {
    const summary = await prisma.expense.groupBy({
      by: ["valueType"],
      _count: {
        id: true,
      },
      _sum: {
        purity: true,
      },
    });

    res.json(summary);
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    res.status(500).json({
      message: "Error fetching expense summary",
      error: error.message,
    });
  }
};
