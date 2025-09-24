import { isDefined, isEmptyString } from "../../../utils/helpers";
import "./Validation.scss";

export const required = (fieldName, value) => {
  if (!isDefined(value) || isEmptyString(value)) {
    return `${fieldName} is required`;
  }
};

export const matchPattern = (pattern) => (fieldName, value) => {
  pattern = typeof pattern === "string" ? new RegExp(pattern) : pattern;

  if (!isEmptyString(value) && value.match(pattern) === null) {
    return `${fieldName} must match the pattern ${pattern}`;
  }
};

export const json = (fieldName, value) => {
  const err = `${fieldName} must be valid JSON string`;

  if (!isDefined(value) || value.trim().length === 0) return;

  if (/^(\{|\[)/.test(value) === false || /(\}|\])$/.test(value) === false) {
    return err;
  }

  try {
    JSON.parse(value);
  } catch (e) {
    return err;
  }
};

export const regexp = (fieldName, value) => {
  try {
    new RegExp(value);
  } catch (err) {
    return `${fieldName} must be a valid regular expression`;
  }
};

export const getTranslatedValidators = (t) => ({
  required: (fieldName, value) => {
    if (!isDefined(value) || isEmptyString(value)) {
      return t("validation_required", { fieldName });
    }
  },

  matchPattern: (pattern) => (fieldName, value) => {
    pattern = typeof pattern === "string" ? new RegExp(pattern) : pattern;

    if (!isEmptyString(value) && value.match(pattern) === null) {
      return t("validation_pattern", { fieldName, pattern });
    }
  },

  json: (fieldName, value) => {
    const err = t("validation_json", { fieldName });

    if (!isDefined(value) || value.trim().length === 0) return;

    if (/^(\{|\[)/.test(value) === false || /(\}|\])$/.test(value) === false) {
      return err;
    }

    try {
      JSON.parse(value);
    } catch (e) {
      return err;
    }
  },

  regexp: (fieldName, value) => {
    try {
      new RegExp(value);
    } catch (err) {
      return t("validation_regexp", { fieldName });
    }
  },
});
