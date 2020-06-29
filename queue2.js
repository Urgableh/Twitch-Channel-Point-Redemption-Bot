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

  else {
    console.log(commandName);
    redeemqueue.append(new redeemMedia(commandName, 10000, false));
  }

}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  //  client.say(opts.channels[0],'/me is now running.');
  console.log(`* Connected to ${addr}:${port}`);
}


class EventQueue {
  /**
   * Base queue of events to be run in order.
   */
  constructor(delay=0) {

      this.pointer = 0;
      this.queue = [];
      this.delay = delay;
      this.schedule_id = setInterval(this.process_queue.bind(this), delay);

  }

  process_queue() {
      if (this.queue.length <= this.pointer) return; // nothing to do.
      this.queue[this.pointer].run();
      this.pointer++;
  }

  reset() {
      this.queue = [];
      this.pointer = 0;
  }
}

class RedeemQueue extends EventQueue {
  /**
   * Specific queue of subscriber events.
   *
   * The delay for this one is 3.35 seconds.
   */
  constructor() {
      super(3350); // delay 3.35 seconds
  }

  append(item, duration, quiet=false) {
      if (quiet) { this.pointer += 1; }
      this.queue.push(new redeemMedia(item, duration));
  }

}

var redeemqueue = new RedeemQueue();

class OnScreenEvent {
  /**
   * On screen events. Things to show on screen for a limited time.
   *
   * payload is a dom tree node
   * duration is the time is stays on screen (in msec)
   */
  constructor(duration=0, payload) {
      this.duration = duration;
      this.payload = payload;
  }
  run() {
      this.interval_id = setTimeout(this.end.bind(this), this.duration);
  }
  end() {
    console.log(this.payload);
    console.log("Executing thing");
  }
}

class redeemMedia extends OnScreenEvent {
  /**
   * A marching Jonathan holding a sign of the newest subscriber.
   * Stays on the screen for 30 seconds, there are 9 variants.
   */

  constructor(payload, duration) {
      /**
       * payload is the name of the subscriber.
       */
      // call the parent constructor with this dom tree node as payload
      super(duration, payload);
  }
}