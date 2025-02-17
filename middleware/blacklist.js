const revokedTokens = new Map();

const addToBlacklist = (token, expiresIn) => {
  const expiryTime = Date.now() + expiresIn * 1000; // Convert seconds to milliseconds
  revokedTokens.set(token, expiryTime);
};

const isTokenRevoked = (token) => {
  const expiryTime = revokedTokens.get(token);
  if (!expiryTime) return false;

  if (Date.now() > expiryTime) {
    revokedTokens.delete(token); // Clean up expired token
    return false;
  }

  return true;
};

// Automatic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [token, expiryTime] of revokedTokens) {
    if (now > expiryTime) {
      revokedTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Runs every hour

module.exports = { addToBlacklist, isTokenRevoked };
