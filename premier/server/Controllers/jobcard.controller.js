const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createJobCard = async (req, res) => {
  try {
    const { date, description, goldsmithId, items } = req.body;

    if (!date || !goldsmithId || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const goldsmithExists = await prisma.goldsmith.findUnique({
      where: { id: parseInt(goldsmithId) },
    });

    if (!goldsmithExists) {
      return res.status(400).json({ error: "Goldsmith not found" });
    }

    const jobCard = await prisma.jobCard.create({
      data: {
        date: new Date(date),
        description: description || null,
        goldsmithId: parseInt(goldsmithId),
        items: {
          create: items.map((item) => ({
            masterItemId: parseInt(item.selectedItem),
            originalGivenWeight: parseFloat(item.originalGivenWeight),
            givenWeight: parseFloat(item.givenWeight),
            touch: parseFloat(item.touch),
            estimateWeight: parseFloat(item.estimateWeight),
          })),
        },
      },
      include: {
        items: true,
        goldsmith: true,
      },
    });

    res.status(201).json(jobCard);
  } catch (error) {
    console.error("Error creating job card:", error);
    res.status(500).json({
      error: "Failed to create job card",
      details: error.message,
    });
  }
};

const updateJobCardItem = async (req, res) => {
  const { itemId } = req.params;

  if (!itemId || isNaN(itemId)) {
    return res.status(400).json({ error: "Invalid item ID" });
  }

  const { finalWeight, wastage, purity, additionalWeights } = req.body;

  try {
    const updatedItem = await prisma.item.update({
      where: {
        id: parseInt(itemId),
      },
      data: {
        finalWeight: finalWeight ? parseFloat(finalWeight) : null,
        wastage: wastage ? parseFloat(wastage) : null,
        purity: purity ? parseFloat(purity) : null,
        additionalWeights: additionalWeights
          ? {
              createMany: {
                data: additionalWeights.map((weight) => ({
                  name: weight.name,
                  weight: parseFloat(weight.weight),
                  operators: weight.operators,
                })),
              },
            }
          : undefined,
      },
      include: {
        additionalWeights: true,
      },
    });
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating job card item:", error);
    res.status(500).json({ error: "Failed to update job card item" });
  }
};
const getJobCardById = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: "Invalid job card ID" });
  }

  try {
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: parseInt(id) },
      include: {
        goldsmith: true,
        items: { include: { masterItem: true, additionalWeights: true } },
      },
    });

    if (!jobCard) {
      return res.status(404).json({ error: "Job card not found" });
    }
    console.log("Fetched Job Card:", {
      id: jobCard.id,
      goldsmithId: jobCard.goldsmithId,
      goldsmithName: jobCard.goldsmith?.name,
    });

    res.json(jobCard);
  } catch (error) {
    console.error("Error fetching job card:", error);
    res.status(500).json({ error: "Failed to fetch job card" });
  }
};

module.exports = {
  createJobCard,
  updateJobCardItem,
  getJobCardById,
};
