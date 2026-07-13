require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const ticketRouter = require('./src/routes/ticketRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const authRouter = require('./src/routes/authRouter');

const app = express();

app.use(express.json());

app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: {
        success: false,
        message: 'Too many requests, please try again after 15 minutes'
    }
});

app.use(limiter);


app.use('/api/tickets', ticketRouter);
app.use('/api/auth', authRouter);

app.use(errorHandler); // ✅ always last middleware

const startServer = async () => {
    await connectDB();        // ✅ DB connects first
    app.listen(6000, () => {
        console.log('Server is running on port 6000');
    });
};

startServer();