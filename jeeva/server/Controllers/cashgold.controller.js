
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


exports.getAllEntries = async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: { id: "asc" },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
};

exports.createEntry = async (req, res) => {
  const {
    date,
    type,
    cashAmount,
    goldValue,
    touch,
    purity,
    goldRate,
    remarks,
  } = req.body;

  try {
    const newEntry = await prisma.entry.create({
      data: {
        date: new Date(date),
        type,
        cashAmount: type === "Cash" ? parseFloat(cashAmount) : null,
        goldValue: type === "Gold" ? parseFloat(goldValue) : null,
        touch: type === "Gold" ? parseFloat(touch) : null,
        purity: purity ? parseFloat(purity) : null,
        goldRate: type === "Cash" ? parseFloat(goldRate) : null,
        remarks:
          remarks && typeof remarks === "string"
            ? remarks
            : remarks?.toString() || null,
      },
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error creating entry:", error);
    res.status(500).json({ error: "Failed to create Entry" });
  }
};

exports.updateEntry = async (req, res) => {
  const { id } = req.params;
  const {
    date,
    type,
    cashAmount,
    goldValue,
    touch,
    purity,
    goldRate,
    remarks, 
  } = req.body;

  try {
    const updatedEntry = await prisma.entry.update({
      where: { id: parseInt(id) },
      data: {
        date: new Date(date),
        type,
        cashAmount: type === "Cash" ? parseFloat(cashAmount) : null,
        goldValue: type === "Gold" ? parseFloat(goldValue) : null,
        touch: type === "Gold" ? parseFloat(touch) : null,
        purity: parseFloat(purity),
        goldRate: type === "Cash" ? parseFloat(goldRate) : null,
        remarks: typeof remarks === "string" ? remarks : null,
      },
    });
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ error: "Failed to update entry" });
  }
};
exports.deleteEntry = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.entry.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.status(200).json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
};