const notFound=(req, res, next)=>{
    const error= new Error(`Not found-${req.originalUrl}`);
    res.status(404);
    next(error);
};
const errorHandler=(err, req, res, next)=>{
    if (res.headersSent) {
        return next(err); // Delegate to default Express error handler if headers are already sent
      }
    const statusCode= res.statusCode===200 ? 500: res.statusCode;
    res.status(statusCode);
    res.json({
        message:err.message,
        stack: process.env.NODE_ENV==="production"?nULL: err.stack,
    });
};
module.exports={notFound, errorHandler};