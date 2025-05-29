const { v4: uuidv4 } = require('uuid');

function generateSessionId() {
  // Generate a UUID without dashes
  const uuid = uuidv4().replace(/-/g, '');

  // Return first 12 characters to ensure max length 12
  return uuid.substring(0, 12);
}

module.exports = { generateSessionId };


