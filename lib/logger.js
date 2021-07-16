/* eslint-disable no-console */

exports.warn = (...args) => {
  console.log('WARNING: ', ...args);
};

exports.error = (...args) => {
  console.log('ERROR: ', ...args);
};
