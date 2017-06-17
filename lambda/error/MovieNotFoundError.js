'use strict';

module.exports = class MovieNotFoundError extends Error {
  constructor() {
    super("Movie Not Found");
    this.name = 'MovieNotFoundError';
  }
};