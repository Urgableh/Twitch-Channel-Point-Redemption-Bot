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
    username: 'urgabot',
    password: 'oauth:pmmx576vhmbxa245chdyk5z8tctuaz'    //from https://twitchapps.com/tmi/
  },
  channels: [
    'urgableh'
  ]
};

// Scene and source constants
const sceneMain = 'Screen Capture 2'
const sceneMain2 = 'AndthenScene'
const sourceMain = 'Andthen'
const sourceMainEx = 'NoAndthen'
const waitPeriod = 20           // Global cooldown (s) when triggering alerts to disable again

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
client.connect();

// Global variables for functions
var counter1 = 1;
var coolingdown = false;


function cooldown(arg) {
  coolingdown = false;
}

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (coolingdown) {
    console.log('cooling down...');
    return; 
  }
  else {
    if (self) { return; } // Ignore messages from the bot

    // Remove whitespace from chat message
    const commandName = msg.trim();

    // If the command is known, let's execute it
    if (commandName === '!dice') {
      const num = rollDice();
      client.say(target, `You rolled a ${num}`);
      console.log(`* Executed ${commandName} command`);
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
    client.say(target,`AND THEN?!`);
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
 //     wait(waitPeriod*1000);
    })
    .catch(err => {
      console.log(err);
    });
    counter1++;
    console.log(`* Executed ${commandName} command`);     
  }
  else {     // Activate if counter1 is divisible by 5.
    client.say(target,`NO AND THEN!!`);
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
 //     wait(waitPeriod*1000);
    })
    .catch(err => {
      console.log(err);
    });
    counter1++;
    console.log(`* Executed ${commandName} command`);     
  }
/*
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
*/
}
