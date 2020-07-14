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

// Global variables to store csv data upon initiation
var obsData = [];
var credentialsData = [];

// Reads a file in the same directory
function readData() {
  var text1 = fs.readFileSync('data.csv', 'utf8');
  processData(text1, obsData);
  var text2 = fs.readFileSync('credentials.csv', 'utf8');
  processData(text2, credentialsData);
}

// Processes a csv into "lines" variable by splitting
function processData(allText, lines) {
  allText = allText + ''; // Makes allText a string
  var allTextLines = allText.split(/\r\n|\n/); // Splits lines by rows
  var headers = allTextLines[0].split(','); // Splits the first row by commas as header
  // Split remaining data and assigns associated headers with them
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
}

// Execute data reading and storage
readData();

// Define keys for pubsub
const clientId = credentialsData[0][1][1];    // https://twitchtokengenerator.com/
const accessToken = credentialsData[1][1][1]; // https://twitchtokengenerator.com/
const clientSecret = credentialsData[2][1][1];
const refreshToken = credentialsData[3][1][1];  // https://twitchtokengenerator.com/
const channelId = credentialsData[4][1][1];     // https://codepen.io/Alca/pen/yLBdjyb
 
// Define chatbot and channel configuration options
const opts = {
  identity: {
    username: credentialsData[5][1][1],   // Username of the chatbot
    password: credentialsData[6][1][1]    // https://twitchapps.com/tmi/
  },
  channels: [
    credentialsData[7][1][1]    // Channel that the chatbot will monitor
  ],
  connection: {
    server: 'irc-ws.chat.twitch.tv',
    port: 80
  }
};

// Initiate Queue variables
var queue = require('queue');
var q = queue();
var results = [];
var temp1 = [], j = 0, temp2;

// Redemption obs function
function runningQueue(redemptionName, sceneName, timeS, redeemerName) {
  var sceneMatch = false, sourceMatch = false;
  q.stop();   // Stop the queue first. It will resume after a timeout.
  q.timeout = 99999;
  console.log(redemptionName);
  obs.send('GetSceneList')
  .then(data => {
    // If the alert scene collection is implanted in the current scene
    for (i=0; i<data.scenes.length - 1; i++) {
      if (data.scenes[i].name == sceneName) { // Match the scene name
        sceneMatch = true;
        for (j=0; j<data.scenes[i].sources.length; j++) {
          if (data.scenes[i].sources[j].name == redemptionName) { // Match the source name
            sourceMatch = true;
          }
        }
      }
    }
    obs.send('GetCurrentScene')
    .then(data => {
        // If the alert scene is in the current scene
        if (data.name == sceneName) { // Match the scene name
          sceneMatch = true;
        }
        for (i=0; i< data.sources.length - 1; i++) {
          if (data.sources[i].name == redemptionName) { // Match the source name
            sourceMatch = true;
          }
        }
    })
    .then(data => {
      if (sceneMatch == true && sourceMatch == true) {
        redeemChat(redemptionName, redeemerName); // Chat bot messages the chat room
        obs.send('SetSceneItemRender', {
          source: redemptionName,
          render: false,          // Disable visibility
          "scene-name": sceneName
        })
        .catch(err => {
          console.log(err);
        });
        wait(100);  // Necessary to wait between setting attributes
        // It was found that it would ignore one of the requests if it was too fast.
        obs.send('SetSceneItemRender', {
          source: redemptionName,
          render: true,           // Enable visibility
          "scene-name": sceneName
        })
        .catch(err => {
          console.log(err);
        });
        // Set a timeout to disable visibility after a certain time
        temp1[j] = setTimeout(function() {
          obs.send('GetSceneList')
          .then(data => {
            obs.send('SetSceneItemRender', {
              source: redemptionName,
              render: false,          // Disable visibility
              "scene-name": sceneName
            })
            .catch(err => {
              console.log(err);
            });
          })
        }, (timeS + 3)*1000);
        if (temp2) {  // If a timeout exists to start the queue, clear it before resetting it.
          clearTimeout(temp2);
        }
        temp2 = setTimeout(startqueue, (timeS+3)*1000); // Restart the queue when visibility is reset
        j++;
      }
      else {  // Continue with the queue if the source and scene are not matched
        console.log(redemptionName + " is not a recognised alert redemption in the current scene.");
        startqueue();
      }
    })
  })
}

// Chatbot to say who's redemption is being fulfilled atm
function redeemChat(redemptionName, redeemerName) {
  client.say(opts.channels[0],`Playing ${redeemerName}'s ${redemptionName}`);
}

// Start queue
function startqueue() {
  q.start();
}

// Redemption internal function to match data.csv to the redemption
function inRedemption(channelId, message) {
  var timeS;
  var redemptionName = null;
  var redeemerName = message.userDisplayName;
  var sceneName = null;
  var i;
  for (i=0; i < obsData.length ; i++) {
    if (message.rewardName == obsData[i][4][1]) { // If redemption matches csv's command
      redemptionName = obsData[i][1][1];
      sceneName = obsData[i][0][1];
      timeS = (parseFloat(obsData[i][2][1])); // Change string duration to a float
    }
  }
  return [redemptionName, sceneName, timeS, redeemerName];
}

// Redemption request monitoring using pubsub client
const runRedemption = async () => {
  const twitchClient = TwitchClient.withCredentials(clientId, accessToken, undefined, {clientSecret, refreshToken, onRefresh: async (t) => {}});
  const pubSubClient = new PubSubClient();
  await pubSubClient.registerUserListener(twitchClient);
  var temp = false; // Temporary variable to make sure the queue doesn't restart on every redemption

  pubSubClient.onRedemption(channelId, (message) => {
    if ( q.length == 0 ) {  // If the queue has no items in it
      temp = true;
    }
    else {
      temp = false;
    }
    console.log("Redemption received");
    var redeemed = inRedemption(channelId, message); // Match data.csv to the redemption
    q.push(function (run) { // Add OBS manipulation item into queue
      results.push(runningQueue(redeemed[0], redeemed[1], redeemed[2], redeemed[3]))
      run();
    })
    q.push(function (run) { // Add console logging item into queue
      results.push(console.log("Redemption complete"));
      run();
    })
    if (temp){  // If the queue has no items in it when redemption was received, start the queue.
      q.start();
    }
  })
}

// Always run redemption bot functions
runRedemption();

// Create a client with credential specified options
const client = new tmi.client(opts);
const obs = new OBSWebSocket();

obs.connect() // Connect to OBS
.then(() => {
    console.log(`Success! We're connected & authenticated to OBS.`);
    return obs.send('GetSceneList');
})
.then(data => {
    console.log(`${data.scenes.length} Available Scenes!`);
})
.catch(err => {
    console.log(err);
    console.log("Unable to connect to OBS. Check that OBS is running and OBS-Websocket has been installed.")
});

// Register event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect()
.catch(err => {
  console.log(err);
  console.log("Unable to connect to Twitch IRC server.")
});

// Global variables for functions
var coolingdown = false;
var subonly = false;
var sourceName = null;
var sceneName = null;
var timeS = null;

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  // Remove whitespace from chat message and take the first word
  const commandName = msg.trim().split(' ')[0];

  if (coolingdown) {    // If cooling down, keep monitoring chat but do not respond
    console.log('cooling down...');
    return; 
  }

  else {
    if (self) { return; } // Ignore messages from the bot

    var subbed = context.subscriber;  // Variable to check if message is from a subscriber
    
    // Toggle submode if channel owner or moderator
    if (context.username === `${opts.channels[0].split("#").pop()}` || context.mod === true) {
      if (commandName === '!submode') {
        submode(target, context, msg, self);
        return;
      }
    }

    // If sub mode is enabled and chatter is not a sub, then return.
    if (subonly && !subbed) {
      return;
    }

    else {    
      for (i=0; i < obsData.length - 1; i++) {
        // If command name in chat matches and it is not a channel point redemption
        if (commandName == obsData[i][4][1] && obsData[i][3][1] == 'FALSE') {
          sourceName = obsData[i][1][1];
          sceneName = obsData[i][0][1];
          timeS = (parseFloat(obsData[i][2][1])); // Change string duration to a float

          activateSource(commandName, sourceName, sceneName); // Enable source visibility
          coolingdown = true;   // Sets a cooldown variable to true
          setTimeout(cooldown, timeS*1000);  // Resets cooldown to false and disables visibility after a set timeout
          return;
        }
      }
    }
    //console.log(`* Unknown command ${commandName}`);
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  //  client.say(opts.channels[0],'/me is now running.');
  console.log(`* Connected to ${addr}:${port}`);
}

// Cooldown function that resets the cooldown and resets invisibility of sources
function cooldown() {
  coolingdown = false;  // Reset global variable coolingdown to false
  obs.send('GetSceneList')
  .then(data => {
    obs.send('SetSceneItemRender', {
      source: sourceName,
      render: false,          // Disable visibility
      "scene-name": sceneName
    });
  })
}

// Function to hold the program for ms seconds in milliseconds
function wait(ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
    end = new Date().getTime();
 }
}

// Function to enable the OBS source visibility
function activateSource(commandName, sourceName, sceneName){
    obs.send('GetSceneList')
    .then(data => {
        obs.send('SetSceneItemRender', {
        source: sourceName,
        render: true,           // Enable visibility
        "scene-name": sceneName
      })
    })
    .catch(err => {
      console.log(err);
    });
    console.log(`* Executed ${commandName} command`);
}

// Function to enable sub-only mode for chatbot recognition
function submode(target, context, msg, self, commandName){
  subonly = !subonly; // Boolean toggle
  var mode;
  if (subonly === true) {
    mode = 'sub only';
  }
  else {
    mode = 'free for all';
  }
  client.say(target, `/me is in ${mode} mode.`) // Message the chat room
  .catch(err => {
    console.log(err);
  });
}
