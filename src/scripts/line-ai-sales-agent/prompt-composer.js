import { SECRET_FIELD_PATTERN, SECRET_VALUE_PATTERNS } from './state.js';

function isSecretValue(value) {
  return SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(String(value ?? '')));
}

function replacementFor(field, values, redactedFields) {
  if (SECRET_FIELD_PATTERN.test(field) || isSecretValue(values[field])) {
    redactedFields.push(field);
    return '[ไม่ใส่ข้อมูลลับ]';
  }
  const value = values[field];
  if (value === undefined || value === null || String(value).trim() === '') return `[กรอก ${field}]`;
  return String(value).trim();
}

export function composePrompt(prompt, values = {}) {
  if (!prompt?.template) throw new Error('Prompt template is required');
  const redactedFields = [];
  const text = prompt.template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawField) => replacementFor(rawField.trim(), values, redactedFields));
  return {
    promptId: prompt.id,
    text,
    redactedFields: [...new Set(redactedFields)],
    safetyNote: prompt.safetyNote ?? 'Do not include a secret or any account credential in this prompt.',
  };
}

export function getEditableFields(prompt) {
  return (prompt?.editableFields ?? []).filter((field) => !SECRET_FIELD_PATTERN.test(field));
}
