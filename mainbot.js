/*
In cmd, install the following packages:
npm install tmi.js
npm install obs-websocket-js

Twitch chatbot followed this guide: https://dev.twitch.tv/docs/irc
*/

const tmi = require('tmi.js');
const OBSWebSocket = require('obs-websocket-js');
 
// Define configuration options
const opts = {
  identity: {
    username: 'Jongcore',
    password: 'oauth:8fgiuqhuvjxuyriyi0ti7nwicvmvne'    //from https://twitchapps.com/tmi/
  },
  channels: [
    'jonathanong'
  ],
  connection: {
    server: 'irc-ws.chat.twitch.tv',
    port: 80
  }
};

// Scene and source constants
const sceneMain = 'GRANDPIANO'
const sourceMain = 'and then'
const sourceMainEx = 'no and then'
const waitPeriod = 15           // Global cooldown (s) when triggering alerts to disable again

// Create a client with our options
const client = new tmi.client(opts);
const obs = new OBSWebSocket();

obs.connect()
.then(() => {
    console.log(`Success! We're connected & authenticated.`);
    return obs.send('GetSceneList');
})
.then(data => {
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

    // Deactivates then reactivates the visibility of the Andthen alert in Screen Capture 2
    if (commandName === '!andthen') {
      andthenf(target, context, msg, self, commandName);
      coolingdown = true;   // sets a cooldown variable to true
      setTimeout(cooldown, waitPeriod*1000);  // calls the function to re-enable commands
      return;
    }

    else {
//        console.log(`* Unknown command ${commandName}`);
    }

  }
  
}

//////// FUNCTION DEFINITIONS BELOW ////////

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  //  client.say(opts.channels[0],'/me is now running.');
  console.log(`* Connected to ${addr}:${port}`);
}

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

// Function to hold the program for ms seconds in milliseconds
function wait(ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
    end = new Date().getTime();
 }
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
