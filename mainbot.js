const tmi = require('tmi.js');

// Define configuration options
const opts = {
  identity: {
    username: 'urgabot',
    password: 'oauth:fykfajrfs8kb5sfp82t1ey8z8qcygn'
  },
  channels: [
    'urgableh'
  ]
};
// Create a client with our options
const client = new tmi.client(opts);

const OBSWebSocket = require('obs-websocket-js');
 
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
      client.say(target,`AND THEN?!`);
      obs.send('SetCurrentScene', {
        'scene-name': 'Screen Capture 2'
      });
      obs.send('GetSceneList')
      .then(data => {
        console.log(data);
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