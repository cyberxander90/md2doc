const express = require('express');
const logger = require('./logger');

module.exports = (port, staticPath) => {
  const app = express();

  app.use(express.static(staticPath));

  app.listen(port, () => {
    logger.info(`Example app listening at http://localhost:${port}`);
  });

  return app;
};
