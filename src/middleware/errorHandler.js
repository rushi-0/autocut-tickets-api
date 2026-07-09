const errorHandler = (err, req, res, next) => {
    console.error(err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong, please try again later'
            : err.message
    });
};

module.exports = errorHandler;
