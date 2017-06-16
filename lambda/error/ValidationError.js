'use strict';

module.exports = class ValidationError extends Error {
  constructor(incorrectSlotName, reason, suggestions) {
    super(reason);
    this.incorrectSlotName = incorrectSlotName;
    this.reason = reason;
    this.name = 'ValidationError';
    this.suggestions = suggestions || [];
  }
};