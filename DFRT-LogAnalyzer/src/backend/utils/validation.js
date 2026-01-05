/**
 * Input Validation Utilities
 * Provides comprehensive validation for API inputs
 */

const { AppError } = require('../middleware/error.middleware');

class ValidationRule {
  constructor(field, rules = {}) {
    this.field = field;
    this.rules = rules;
    this.errors = [];
  }

  validate(value) {
    const { required, type, minLength, maxLength, pattern, custom } = this.rules;

    if (required && (value === undefined || value === null || value === '')) {
      this.errors.push(`${this.field} is required`);
      return this;
    }

    if (value === undefined || value === null) return this;

    if (type && typeof value !== type) {
      this.errors.push(`${this.field} must be of type ${type}`);
    }

    if (minLength && value.length < minLength) {
      this.errors.push(`${this.field} must be at least ${minLength} characters`);
    }

    if (maxLength && value.length > maxLength) {
      this.errors.push(`${this.field} must not exceed ${maxLength} characters`);
    }

    if (pattern && !pattern.test(value)) {
      this.errors.push(`${this.field} format is invalid`);
    }

    if (custom && !custom(value)) {
      this.errors.push(`${this.field} validation failed`);
    }

    return this;
  }

  hasErrors() {
    return this.errors.length > 0;
  }
}

class Validator {
  constructor(data) {
    this.data = data;
    this.rules = [];
    this.errors = {};
  }

  addRule(field, rules) {
    const rule = new ValidationRule(field, rules);
    rule.validate(this.data[field]);
    if (rule.hasErrors()) {
      this.errors[field] = rule.errors;
    }
    this.rules.push(rule);
    return this;
  }

  validate() {
    return Object.keys(this.errors).length === 0;
  }

  getErrors() {
    return this.errors;
  }

  throwIfInvalid() {
    if (!this.validate()) {
      throw new AppError(
        `Validation failed: ${JSON.stringify(this.errors)}`,
        400
      );
    }
  }
}

// Predefined validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  ipAddress: /^(\d{1,3}\.){3}\d{1,3}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  fileName: /^[\w\-.]+$/
};

// Common validators
const validators = {
  validateLogUpload: (data) => {
    const validator = new Validator(data);
    validator
      .addRule('fileName', {
        required: true,
        type: 'string',
        maxLength: 255,
        pattern: patterns.fileName
      })
      .addRule('fileSize', {
        required: true,
        type: 'number',
        custom: (val) => val > 0 && val <= 104857600 // 100MB
      });
    return validator;
  },

  validateAnalysisQuery: (data) => {
    const validator = new Validator(data);
    validator
      .addRule('startDate', {
        required: false,
        type: 'string',
        custom: (val) => !isNaN(Date.parse(val))
      })
      .addRule('endDate', {
        required: false,
        type: 'string',
        custom: (val) => !isNaN(Date.parse(val))
      })
      .addRule('threatLevel', {
        required: false,
        type: 'string',
        custom: (val) => ['critical', 'high', 'medium', 'low'].includes(val)
      });
    return validator;
  },

  validateConfigUpdate: (data) => {
    const validator = new Validator(data);
    validator
      .addRule('key', {
        required: true,
        type: 'string',
        pattern: patterns.alphanumeric
      })
      .addRule('value', {
        required: true
      });
    return validator;
  },

  validateDateRange: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date format', 400);
    }
    if (start > end) {
      throw new AppError('Start date must be before end date', 400);
    }
    return { start, end };
  },

  sanitizeString: (str) => {
    if (typeof str !== 'string') return '';
    return str
      .trim()
      .replace(/[<>\"'&]/g, (char) => ({
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }[char]));
  }
};

module.exports = {
  Validator,
  ValidationRule,
  patterns,
  validators
};
