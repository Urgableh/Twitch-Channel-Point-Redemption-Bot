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

  else if (commandName === '!qon'){
    q.start();
  }
  
  else if (commandName === '!qoff'){
    q.stop();
  }

  else {
    q.push(function (run) {
      results.push(runningQueue(commandName + "1",2));
      run();
    })
    q.push(function (run) {
      results.push(runningQueue(commandName + "2",2));
      run();
    })
    q.push(function (run) {
      results.push(runningQueue(commandName + "3",2));
      run();
    })
    q.push(function (run) {
      results.push(runningQueue(commandName + "4",2));
      run();
    })
    q.push(function (run) {
      results.push(runningQueue(commandName + "5",2));
      run();
    })
    console.log(`* Unknown command ${commandName}`);
    q.start();
  }

}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  //  client.say(opts.channels[0],'/me is now running.');
  console.log(`* Connected to ${addr}:${port}`);
}





// Initiate Queue features
var queue = require('queue');
var q = queue();
var results = [];
var temp;

function runningQueue(str, time) {
    console.log(str);
    q.stop();
    q.timeout = 99999;
    if (temp) {
      clearTimeout(temp);
    }
    temp = setTimeout(startqueue, time*1000);
}

function startqueue() {
  q.start();
}

// begin processing, get notified on end / failure
q.start(function (err) {
  if (err) throw err
  console.log('all done:', results)
})

/*
// add jobs using the familiar Array API
q.push(function (cb) {
  results.push(sayhi('sdasd'))
  q.stop() ///////////////////////////////////////////////////
  cb()
})
 
q.push(
  function (cb) {
    results.push('four')
    cb()
  },
  function (cb) {
    results.push('five')
    cb()
  }
)
 
// jobs can accept a callback or return a promise
q.push(function () {
  return new Promise(function (resolve, reject) {
    results.push('one')
    resolve()
  })
})
 
q.unshift(function (cb) {
  results.push('one')
  cb()
})
 
q.splice(2, 0, function (cb) {
  results.push('three')
  cb()
})
 
// use the timeout feature to deal with jobs that
// take too long or forget to execute a callback
q.timeout = 100
 
q.on('timeout', function (next, job) {
  console.log('job timed out:', job.toString().replace(/\n/g, ''))
  next()
})
 
q.push(function (cb) {
  setTimeout(function () {
    console.log('slow job finished')
    cb()
  }, 200)
})
 
q.push(function (cb) {
  console.log('forgot to execute callback')
})
 
// jobs can also override the queue's timeout
// on a per-job basis
function extraSlowJob (cb) {
  setTimeout(function () {
    console.log('extra slow job finished')
    cb()
  }, 400)
}
 
extraSlowJob.timeout = 500
q.push(extraSlowJob)
 
// get notified when jobs complete
q.on('success', function (result, job) {
  console.log('job finished processing:', job.toString().replace(/\n/g, ''))
})
 
// begin processing, get notified on end / failure
q.start(function (err) {
  if (err) throw err
  console.log('all done:', results)
})
*/