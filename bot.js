/**
 * A simple IRC Bot
 * 
 * @Version [see package.json]
 * @Author Alex Gaspar
 */
var net = require('net'),
    sys = require('sys'),
    events = require('events');

var config = require('./config/index.js');

/**
 *
 * @param  {String}       channel          Irc channel to connect to
 * @param  {Object}       commands         List of commands
 */
var Server = function(channel, commands) {
  // IRC Configuration
  this.host = config.irc.host || 'irc.freenode.org';
  this.port = config.irc.port || 6667;
  this.nickname = config.irc.nickname;
  this.realname = config.irc.realname;
  this.prefix = config.irc.prefix; // char before the command
  this.commands = commands;
  this.channel = channel;

  // Default Server configuration
  this.encoding = "utf8";
  this.timeout = 3600*1000;
  this.connection = null;
};

// http://blog.nodejitsu.com/using-sys-inherits-in-node-js
sys.inherits(Server, events.EventEmitter);


/**
 * addListener
 *
 */
Server.prototype.addListener = function(event, listener) {
  var that = this;
  return this.connection.addListener(event, ( function( ) {
    return function() {
      listener.apply(that, arguments);
    };
  })());
};

/**
 * connect
 * Set up the connection, listeners & default parameters
 *
 */
Server.prototype.connect = function() {
  if(this.connection === null) {
    this.connection = net.createConnection( this.port, this.host );
    this.connection.setEncoding( this.encoding );
    this.connection.setTimeout( this.timeout );

    this.addListener('connect', this.onConnect);
    this.addListener('data', this.onReceive);
    this.addListener('eof', this.onEOF);
    this.addListener('timeout', this.onTimeout);
    this.addListener('close', this.onClose);
  } else {
    console.log("Already connected...");
  }
};

/**
 * onEOF
 * Handle the EOF event
 *
 */
Server.prototype.onEOF = function() {
  console.log("EOF");
};

/**
 * onConnect 
 * Once the connection is open, identify
 * the user and join a channel
 *
 */
Server.prototype.onConnect = function() {
  this.identify();
  this.join(this.channel);
};

/**
 * onTimeout
 * Handle the timeout event
 *
 */
Server.prototype.onTimeout = function() {
  console.log("Connection timeout");
};

/**
 * onClose
 * Handle the close event
 *
 * @param  {String}       err         Error message
 */
Server.prototype.onClose = function(err) {
  console.log("Connection closed", err);
};

/**
 * onReceive
 * Handle the receive event
 *
 * @param  {String}       msg         Message from the server
 */
Server.prototype.onReceive = function(msg) {
  this.action(msg);
};

/**
 * join
 * Join an IRC channel
 *
 * IRC Synthax :
 * JOIN <channels> [<keys>]
 *
 * @param  {String}       channel         IRC channel
 */
Server.prototype.join = function(channel) {
  this.write('JOIN #' + channel);
};

/**
 * identify 
 * Identify the user to the server
 * 
 * IRC Synthax :
 * NICK <nickname>
 * USER <username> <hostname> <servername> :<realname>
 */
Server.prototype.identify = function() {
  this.write("NICK _" + this.nickname);
  this.write('USER ' + this.nickname + ' 0' + ' *' + ' :' + this.realname);
};

/**
 * write
 * Send a command to the server
 * Example : PRIVMSG #channel message
 *
 * @param  {String}      command     IRC command to send to the server 
 */
Server.prototype.write = function(command) {
  this.connection.write(command + "\r\n", this.encoding);
};


/**
 * parse
 * Split the message received from the server into command, message
 * channel & sender.
 *
 * @param  {String}      text     Message received from the server
 */
Server.prototype.parse = function(text) {
  var commands = {
    command : null,
    message : "",
    channel : null,
    sender  : null
  };

  var params = text.split(' ');
  // Handle PING from server
  if(params.length == 2) {
    commands.command = params[0];
    commands.sender  = params[1].substring(1);
  } else {
  // Handle the other kind of message (PRIVATEMSG,...)
  // Struct -> :user COMMAND #channel :message
    commands.command = params[1];
    commands.channel = params[2];

    // Recreate the message
    var msg= "";
    for(var i = 3; i < params.length; i++) {
      msg += params[i] + " ";
    }
    commands.message = msg.substr(1);
  }

  return commands;
};

/**
 * action
 * According to the 
 *
 * @param  {String}      text     Message received from the server
 */
Server.prototype.action = function(text) {
  // parse the data
  commands = this.parse(text);

  switch(commands.command) {
    case 'PRIVMSG':
      var msg = commands.message;
      if(msg[0] == this.prefix)
        this.respondToBotCommand(msg);
      break;
    case 'PING':
      this.write('PONG ' + commands.sender);
      break;
  }
};

/**
 * respondToBotCommand
 *
 */
Server.prototype.respondToBotCommand = function(message) {
  message = message.substr(1); // Remove the prefix
  command = message.split(' ')[0].replace(/\s+/g, '');

  if(typeof this.commands[command] !== 'undefined') {
    var fn = this.commands[command];
    this.write('PRIVMSG #' + this.channel + ' ' + fn());
  }
};

module.exports = Server;