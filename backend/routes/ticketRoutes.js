const express = require('express');
const {
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    deleteTicket,
    correctAiPrediction,
    addActivity
} = require('../controllers/ticketController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
    .route('/')
    .get(getTickets)
    .post(createTicket);

router
    .route('/:id')
    .get(getTicket)
    .put(updateTicket)
    .delete(deleteTicket);

router.post('/:id/activity', addActivity);
router.put('/:id/correct', authorize('agent', 'admin'), correctAiPrediction);

module.exports = router;
