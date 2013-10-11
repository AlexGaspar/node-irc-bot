node-irc-bot
============

A Simple IRC bot


Bot Commands
============

You can add your own command by editing the commads object and add your function.

Synthax
------------
Object = {
  command: function,
  command2: function2
}


Example Config file
====================
host     : 'irc.freenode.org'
port     : 6667 
nickname : 'Nodirc'
realname : 'NodIrc Cold'
prefix   : '!'
