/**
 * Logger Utility
 * Only logs when NODE_ENV !== 'production'
 * Helps reduce console spam in production while keeping debug info during development
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args) => {
    console.warn(...args);
  },

  error: (...args) => {
    console.error(...args);
  },

  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

module.exports = logger;
