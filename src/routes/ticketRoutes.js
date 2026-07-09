const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { upload, verifyFileContent } = require('../middleware/upload');

const { getAllTickets, getTicketById, createTicket, updateTicket, deleteTicket } = require('../controller/ticketController');

router.get('/', authMiddleware, getAllTickets);
router.get('/:id', getTicketById);
router.post('/', authMiddleware, upload.single('attachment'), verifyFileContent, createTicket);
router.put('/:id', authMiddleware, updateTicket);
router.delete('/:id', authMiddleware, deleteTicket);

module.exports = router;