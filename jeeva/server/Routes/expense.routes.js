const express = require('express');
const router = express.Router();
const {
    getAllExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseSummary
} = require('../Controllers/expense.controller');

router.get('/', getAllExpenses);
router.get('/summary', getExpenseSummary);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;