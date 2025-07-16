const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createBill = async (req, res) => {
  try {
    const {
      customerId,
      goldRate,
      hallmarkCharges,
      hallmarkBalance,
      items = [],
      receivedDetails = [],
      totalWeight,
      totalPurity,
      totalAmount,
    } = req.body;

    console.log("req body", req.body);

    if (
      totalWeight === undefined ||
      totalPurity === undefined ||
      totalAmount === undefined
    ) {
      return res.status(400).json({
        error:
          "Missing calculated totals: totalWeight, totalPurity, or totalAmount",
      });
    }

    const latestBill = await prisma.bill.findFirst({
      orderBy: { id: "desc" },
    });

    const billNo = `BILL-${(latestBill?.id || 0) + 1}`;

    const bill = await prisma.$transaction(async (tx) => {
      const newBill = await tx.bill.create({
        data: {
          billNo,
          customerId: parseInt(customerId),
          goldRate: parseFloat(goldRate) || 0,
          hallmarkCharges: parseFloat(hallmarkCharges),
          hallmarkBalance: parseFloat(hallmarkBalance),
          totalWeight: parseFloat(totalWeight),
          totalPurity: parseFloat(totalPurity),
          totalAmount: parseFloat(totalAmount),
          items: {
            create: items.map((item) => ({
              coinValue: parseFloat(item.coinValue),
              quantity: parseInt(item.quantity),
              percentage: parseFloat(item.percentage),
              touch: parseFloat(item.touch),
              weight: parseFloat(item.weight),
              purity: parseFloat(item.purity),
              amount: item.amount,
              goldRate: item.goldRate,
            })),
          },
          receivedDetails: {
            create: receivedDetails.map((r) => ({
              date: new Date(r.date),
              goldRate: parseFloat(r.goldRate) || 0,
              givenGold: parseFloat(r.givenGold),
              touch: parseFloat(r.touch),
              purityWeight: parseFloat(r.purityWeight),
              amount: parseFloat(r.amount),
              paidAmount: parseFloat(r.paidAmount),
              hallmark: parseFloat(r.hallmark) || 0,
            })),
          },
        },
        include: {
          items: true,
          receivedDetails: true,
        },
      });

      return newBill;
    });

    res.status(201).json({ bill });
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ error: "Failed to create Bill" });
  }
};

const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        items: true,
        receivedDetails: true,
      },
    });

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({ error: "Failed to fetch bill" });
  }
};

const getBills = async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        customer: true,
        items: true,
        receivedDetails: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bills" });
  }
};
const deleteBill = async (req, res) => {
  const { id } = req.params;

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "Invalid bill ID" });
  }

  try {
    const existingBill = await prisma.bill.findUnique({
      where: { id: parsedId },
      include: {
        items: true,
        receivedDetails: true,
      },
    });

    if (!existingBill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    await prisma.bill.delete({
      where: { id: parsedId },
    });

    return res.status(200).json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Error deleting bill:", error);
    return res.status(500).json({ message: "Failed to delete bill" });
  }
};

const addReceiveEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedDetails = [] } = req.body;

    console.log("reee", req.body);

    if (!receivedDetails.length) {
      return res.status(400).json({ error: "No receive details provided" });
    }

    const sanitizeDate = (date) => {
      if (!date) return new Date().toISOString();
      if (typeof date === "string") {
        if (date.includes("T")) return date;
        return new Date(date).toISOString();
      }
      if (date instanceof Date) return date.toISOString();
      return new Date().toISOString();
    };

    const existingBill = await prisma.bill.findUnique({
      where: { id: parseInt(id) },
      include: { receivedDetails: true },
    });

    if (!existingBill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    console.log("existing", existingBill);

    const sanitizedDetails = receivedDetails
      .filter((detail) => !detail.id)
      .map((detail) => ({
        ...detail,
        date: sanitizeDate(detail.date),
        amount: parseFloat(detail.amount) || 0,
        paidAmount: parseFloat(detail.paidAmount) || 0,
        purityWeight: parseFloat(detail.purityWeight) || 0,
        givenGold: parseFloat(detail.givenGold) || 0,
        goldRate: parseFloat(detail.goldRate) || 0,
        touch: parseFloat(detail.touch) || 0,
        hallmark: parseFloat(detail.hallmark) || 0,
      }));

    if (!sanitizedDetails.length) {
      return res.status(200).json({ message: "No new receive entries to add" });
    }

    const totalNewAmount = sanitizedDetails.reduce(
      (sum, detail) => sum + (parseFloat(detail.amount) || 0),
      0
    );

    const hallbalance = req.body.hallmarkBalance;

    const updatedBill = await prisma.bill.update({
      where: { id: parseInt(id) },
      data: {
        hallmarkBalance: parseFloat(hallbalance),
        receivedDetails: {
          create: sanitizedDetails,
        },
        totalAmount: {
          increment: totalNewAmount,
        },
      },
      include: {
        customer: true,
        items: true,
        receivedDetails: true,
      },
    });

    return res.status(200).json(updatedBill);
  } catch (error) {
    console.error("Error adding receive entry:", error);
    return res.status(500).json({ error: "Failed to add receive entry" });
  }
};

module.exports = {
  createBill,
  getBills,
  getBillById,
  addReceiveEntry,
  deleteBill,
};
