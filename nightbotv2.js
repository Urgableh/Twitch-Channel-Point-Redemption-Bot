/*
In cmd, install the following packages:
npm install tmi.js
npm install obs-websocket-js
npm install --save twitch twitch-pubsub-client

Twitch chatbot followed this guide: https://dev.twitch.tv/docs/irc

package using 'pkg mainbot.js --targets node10-win-x64'
*/

const fs = require('fs');
const util = require('util');
const tmi = require('tmi.js');
const OBSWebSocket = require('obs-websocket-js');
const PubSubClient = require('twitch-pubsub-client').default;
const request = require("request");
const TwitchClient = require('twitch').default;

var obsData = [];
var credentialsData = [];

function readData() {
// Reads a file in the same directory
  var text1 = fs.readFileSync('data.csv', 'utf8');
  processData(text1, obsData);
  var text2 = fs.readFileSync('credentials.csv', 'utf8');
  processData(text2, credentialsData);
}

// Processes a csv into "lines" variable by splitting
function processData(allText, lines) {
  allText = allText + '';
  var allTextLines = allText.split(/\r\n|\n/);
  var headers = allTextLines[0].split(',');

  for (var i=1; i<allTextLines.length; i++) {
      var data = allTextLines[i].split(',');
      if (data.length == headers.length) {

          var tarr = [];
          for (var j=0; j<headers.length; j++) {
              tarr.push([headers[j],data[j]]);
          }
          lines.push(tarr);
      }
  }
  //console.log(lines);
}

// Execute data reading and storage
readData();

// Define keys for pubsub
const clientId = credentialsData[0][1][1];    //https://twitchtokengenerator.com/
const accessToken = credentialsData[1][1][1]; //https://twitchtokengenerator.com/
const clientSecret = credentialsData[2][1][1];
const refreshToken = credentialsData[3][1][1];  //https://twitchtokengenerator.com/
const channelId = credentialsData[4][1][1];      // https://codepen.io/Alca/pen/yLBdjyb
 
// Define configuration options
const opts = {
  identity: {
    username: credentialsData[5][1][1],
    password: credentialsData[6][1][1]    //from https://twitchapps.com/tmi/
  },
  channels: [
    'harrymkwiisr'//'urgableh'//'bryceac'//credentialsData[7][1][1]
  ],
  connection: {
    server: 'irc-ws.chat.twitch.tv',
    port: 80
  }
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect()
.catch(err => {
  console.log(err);
});

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  // Remove whitespace from chat message and take the first word
  const commandName = msg.trim().split(' ')[0];

  if (self) { return; } // Ignore messages from the bot
  
  if (context.username === "urgableh") {
    //if (commandName === "best bot") {
      client.say(target, '@urgableh no u');
      return;
    //}
  }
  else {
      console.log(`* Unknown command ${commandName}`);
  }
  
}

//////// FUNCTION DEFINITIONS BELOW ////////

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  //  client.say(opts.channels[0],'/me is now running.');
  console.log(`* Connected to ${addr}:${port}`);
}