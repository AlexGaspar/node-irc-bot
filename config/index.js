var load = function() {
  var config = {};

  config = require('./irc.js')(config);

  return config;
};

module.exports = load();