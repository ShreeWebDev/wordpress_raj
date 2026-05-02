const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong. Please try again.' 
    : err.message;

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({ success: false, message });
  }

  res.status(status).render('error', {
    title: 'Error',
    message,
    user: req.user || null
  });
};

const notFound = (req, res, next) => {
  const err = new Error('Page not found');
  err.status = 404;
  next(err);
};

module.exports = { errorHandler, notFound };
