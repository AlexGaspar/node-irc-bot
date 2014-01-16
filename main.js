/**
 * A simple IRC Bot
 * 
 *
 * @Version [see package.json]
 * @Author Alex Gaspar
 */

var Bot = require('./bot');


/**
 * Bot's commands
 */
var time = function() {
  var date = new Date();

  return date.getDay() + "/" + date.getMonth() + "/" + date.getYear();
};

var weather = function() { return 'Sunny' };

var commands = {
    time: time
  , weather: weather
};


/**
 * instantiate the bot
 */
var bot = new Bot("banzounet", commands);
bot.connect();
