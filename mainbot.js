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
    credentialsData[7][1][1]
  ],
  connection: {
    server: 'irc-ws.chat.twitch.tv',
    port: 80
  }
};

// console.log(obsData);

// Redemption function
const runRedemption = async () => {
  const twitchClient = TwitchClient.withCredentials(clientId, accessToken, undefined, {clientSecret, refreshToken, onRefresh: async (t) => {

  }});
 
  const pubSubClient = new PubSubClient();
  await pubSubClient.registerUserListener(twitchClient);

  pubSubClient.onRedemption(channelId, (message) => {
    var redemptionName = message.rewardName;
    //console.log(message);
    //console.log(obsData);
    var i;
    for (i=0; i < obsData.length - 1; i++) {
      if (redemptionName == obsData[i][1][1]) {
        obs.send('GetSceneList')
        .then(data => {
          //console.log(data);
          obs.send('SetSceneItemRender', {
            source: redemptionName,
            render: false,          // Disable visibility
            "scene-name": obsData[i][0][1]
          });
          wait(100);  // Necessary to wait between setting attributes
          // It was found that it would ignore one of the requests if it was too fast.
          obs.send('SetSceneItemRender', {
            source: redemptionName,
            render: true,           // Enable visibility
            "scene-name": obsData[i][0][1]
          });
        })
        .catch(err => {
          console.log(err);
        });
        setTimeout(function() {
          obs.send('GetSceneList')
          .then(data => {
            //console.log(data);
            obs.send('SetSceneItemRender', {
              source: redemptionName,
              render: false,          // Disable visibility
              "scene-name": obsData[i][0][1]
            });
          })
        }, (parseFloat(obsData[i][2][1]) + 3)*1000);
        //setTimeout(cooldownRedeem(redemptionName, obsData[i][0][1]), (obsData[i][2][1] + 3)*1000);
      }
    }
  })
}

/*
  pubSubClient.onRedemption(channelId, (message) => {
      console.log(message);
      obs.send('GetSceneList')
      .then(data => {
        //console.log(data);
        obs.send('SetSceneItemRender', {
          source: 'Shipscene',
          render: false,          // Disable visibility
          "scene-name": 'Screen Capture'
        });
        wait(100);  // Necessary to wait between setting attributes
        // It was found that it would ignore one of the requests if it was too fast.
        obs.send('SetSceneItemRender', {
          source: 'Shipscene',
          render: true,           // Enable visibility
          "scene-name": 'Screen Capture'
        });
      })
      .catch(err => {
        console.log(err);
      });
      coolingdown = true;   // sets a cooldown variable to true
      setTimeout(cooldown, 5*1000);  // calls the function to re-enable commands
  });
}
*/
// Run redemption bot
runRedemption();

// Scene and source constants
const sceneMain = 'Screen Capture 2'
const sceneMain2 = 'AndthenScene'
const sourceMain = 'Andthen'
const sourceMainEx = 'NoAndthen'
const waitPeriod = 15           // Global cooldown (s) when triggering alerts to disable again

// Create a client with our options
const client = new tmi.client(opts);
const obs = new OBSWebSocket();

obs.connect()
.then(() => {
    console.log(`Success! We're connected & authenticated to OBS.`);
    return obs.send('GetSceneList');
})
.then(data => {
    //console.log(data);
    console.log(`${data.scenes.length} Available Scenes!`);
})
.catch(err => { // Promise convention dicates you have a catch on every chain.
    console.log(err);
});

// Register our event handlers (defined below)

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect()
.catch(err => {
  console.log(err);
});

// Global variables for functions
var counter1 = 1;
var coolingdown = false;
var subonly = false;

// Cooldown function that resets the cooldown and resets invisibility of sources
function cooldown() {
  coolingdown = false;
  obs.send('GetSceneList')
  .then(data => {
    //console.log(data);
    obs.send('SetSceneItemRender', {
      source: sourceMain,
      render: false,          // Disable visibility
      "scene-name": sceneMain
    });
    obs.send('SetSceneItemRender', {
      source: sourceMainEx,
      render: false,          // Disable visibility
      "scene-name": sceneMain
    });
  })
}

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

    var subbed = context.subscriber;  // variable to check if message is from a subscriber
    
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

    // If the command is known, let's execute it
    if (commandName === '!dice') {
      const num = rollDice();
      client.say(target, `You rolled a ${num}`);
      console.log(`* Executed ${commandName} command`);
      return;
    } 

    // Changes scene between Screen Capture and Screen Capture 2
    if (commandName === '!changeScene') {
      changeScenef(target, context, msg, self, commandName);
      coolingdown = true;   // sets a cooldown variable to true
      setTimeout(cooldown, waitPeriod*1000);  // calls the function to re-enable commands
      return;
    }

    // Deactivates then reactivates the visibility of the Andthen alert in Screen Capture 2
    if (commandName === '!andthen') {
      andthenf(target, context, msg, self, commandName);
      coolingdown = true;   // sets a cooldown variable to true
      setTimeout(cooldown, waitPeriod*1000);  // calls the function to re-enable commands
      return;
    }

    else {
        console.log(`* Unknown command ${commandName}`);
    }

  }
  
}

//////// FUNCTION DEFINITIONS BELOW ////////

// Function called when the "dice" command is issued
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  //  client.say(opts.channels[0],'/me is now running.');
  console.log(`* Connected to ${addr}:${port}`);
}

// Function to hold the program for ms seconds in milliseconds
function wait(ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
    end = new Date().getTime();
 }
}

// function for swapping scenes
function changeScenef(target, context, msg, self, commandName){
  // Bot types in chat
  client.say(target,`changeScene`);
  obs.send('SetCurrentScene', {
    'scene-name': sceneMain
  });
  obs.send('GetSceneList')    // Contains most scene and source info
  .then(data => {
    //console.log(data);
    if (data["current-scene"] === sceneMain) {
      obs.send('SetCurrentScene', {
        'scene-name': sceneMain2
      });
    }
  })
  .catch(err => {
    console.log(err);
  });
  console.log(`* Executed ${commandName} command`);
}

// function for andthen
function andthenf(target, context, msg, self, commandName){
  if (counter1%5 !== 0) {     // Activate if counter1 is not divisible by 5.
    client.say(target,`AND THEN?! (${counter1})`);
    obs.send('GetSceneList')
    .then(data => {
      //console.log(data);
      obs.send('SetSceneItemRender', {
        source: sourceMain,
        render: false,          // Disable visibility
        "scene-name": sceneMain
      });
      wait(100);  // Necessary to wait between setting attributes
      // It was found that it would ignore one of the requests if it was too fast.
      obs.send('SetSceneItemRender', {
        source: sourceMain,
        render: true,           // Enable visibility
        "scene-name": sceneMain
      });
    })
    .catch(err => {
      console.log(err);
    });
    counter1++;
    console.log(`* Executed ${commandName} command`);     
  }
  else {     // Activate if counter1 is divisible by 5.
    client.say(target,`NO AND THEN!! (${counter1})`);
    obs.send('GetSceneList')
    .then(data => {
      //console.log(data);
      obs.send('SetSceneItemRender', {
        source: sourceMainEx,
        render: false,          // Disable visibility
        "scene-name": sceneMain
      });
      wait(100);  // Necessary to wait between setting attributes
      // It was found that it would ignore one of the requests if it was too fast.
      obs.send('SetSceneItemRender', {
        source: sourceMainEx,
        render: true,           // Enable visibility
        "scene-name": sceneMain
      });
    })
    .catch(err => {
      console.log(err);
    });
    counter1++;
    console.log(`* Executed ${commandName} command`);     
  }
}

function submode(target, context, msg, self, commandName){
  subonly = !subonly;
  var mode;
  if (subonly === true) {
    mode = 'sub only';
  }
  else {
    mode = 'free for all';
  }
  client.say(target, `/me is in ${mode} mode.`)
  .catch(err => {
    console.log(err);
  });
}