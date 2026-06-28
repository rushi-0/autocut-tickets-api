const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const {getAllTickets,getTicketById,createTicket,updateTicket,deleteTicket} = require('../controller/ticketController');

router.get('/',getAllTickets);
router.get('/:id',getTicketById);
router.post('/', authMiddleware, upload.single('attachment'), createTicket);
router.put('/:id',updateTicket);
router.delete('/:id',deleteTicket);

module.exports = router;