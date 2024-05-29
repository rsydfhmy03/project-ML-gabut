const blacklist = new Set();

function isTokenBlacklisted(token) {
  return blacklist.has(token);
}

function addTokenToBlacklist(token) {
  blacklist.add(token);
}

module.exports = { isTokenBlacklisted, addTokenToBlacklist };
