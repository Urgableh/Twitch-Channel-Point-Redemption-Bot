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
    password: 'oauth:kq8b9ib4f9z23zy43vc97msawkpt8r'    //from https://twitchapps.com/tmi/
  },
  channels: [
    'urgableh'
  ]
};
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

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
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
  if (commandName === '!andthen') {
      // Bot types in chat
      client.say(target,`AND THEN?!`);
      obs.send('SetCurrentScene', {
        'scene-name': 'Screen Capture 2'
      });
      obs.send('GetSceneList')    // Contains most scene and source info
      .then(data => {
        //console.log(data);
        if (data["current-scene"] === 'Screen Capture 2') {
          obs.send('SetCurrentScene', {
            'scene-name': 'Screen Capture'
          });
        }
      })
      .catch(err => {
        console.log(err);
      });
    console.log(`* Executed ${commandName} command`);
  }

  // Deactivates then reactivates the visibility of the Andthen alert in Screen Capture 2
  if (commandName === '!andthen2') {
    client.say(target,`AND THEN 2?!`);
    obs.send('GetSceneList')
    .then(data => {
      //console.log(data);
      obs.send('SetSceneItemRender', {
        source: 'Andthen',
        render: false,          // Disable visibility
        "scene-name": 'Screen Capture 2'
      });
      wait(100);  // Necessary to wait between setting attributes
      // It was found that it would ignore one of the requests if it was too fast.
      obs.send('SetSceneItemRender', {
        source: 'Andthen',
        render: true,           // Enable visibility
        "scene-name": 'Screen Capture 2'
      });
    })
    .catch(err => {
      console.log(err);
    });
  console.log(`* Executed ${commandName} command`);
  }
      
  else {
      console.log(`* Unknown command ${commandName}`);
  }
  

}
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