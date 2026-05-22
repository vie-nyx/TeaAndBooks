/**
 * Validation utility functions for form inputs
 */

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email.trim()) {
    return { isValid: false, message: "Email is required" };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Please enter a valid email address" };
  }
  
  return { isValid: true, message: "" };
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain an uppercase letter" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain a lowercase letter" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain a number" };
  }
  
  return { isValid: true, message: "" };
};

/**
 * Validate username
 * @param {string} username - The username to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateUsername = (username) => {
  if (!username.trim()) {
    return { isValid: false, message: "Username is required" };
  }
  
  if (username.length < 3) {
    return { isValid: false, message: "Username must be at least 3 characters" };
  }
  
  if (username.length > 20) {
    return { isValid: false, message: "Username must be at most 20 characters" };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, message: "Username can only contain letters, numbers, underscores, and hyphens" };
  }
  
  return { isValid: true, message: "" };
};

/**
 * Validate group name
 * @param {string} groupName - The group name to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateGroupName = (groupName) => {
  if (!groupName.trim()) {
    return { isValid: false, message: "Group name is required" };
  }
  
  if (groupName.length < 1) {
    return { isValid: false, message: "Group name must be at least 1 character" };
  }
  
  if (groupName.length > 50) {
    return { isValid: false, message: "Group name must be at most 50 characters" };
  }
  
  return { isValid: true, message: "" };
};

/**
 * Validate message input
 * @param {string} message - The message to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateMessage = (message) => {
  if (!message.trim()) {
    return { isValid: false, message: "Message cannot be empty" };
  }
  
  return { isValid: true, message: "" };
};

/**
 * Validate required field
 * @param {string} value - The value to validate
 * @param {string} fieldName - The field name for error message
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateRequired = (value, fieldName = "This field") => {
  if (!value || !value.toString().trim()) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  return { isValid: true, message: "" };
};

/**
 * Check if at least one item is selected
 * @param {array} items - Array of selected items
 * @param {string} fieldName - The field name for error message
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateSelection = (items, fieldName = "Selection") => {
  if (!items || items.length === 0) {
    return { isValid: false, message: `Please select at least one ${fieldName}` };
  }
  
  return { isValid: true, message: "" };
};
