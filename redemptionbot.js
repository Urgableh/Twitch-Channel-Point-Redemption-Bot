const tmi = require('tmi.js');
const OBSWebSocket = require('obs-websocket-js');
const PubSubClient = require('twitch-pubsub-client').default;
const TwitchClient = require('twitch').default;

const clientId = 'dyoqxvurvq113l0ugaa43r1la3j46z';
const accessToken = '906nr7hhet968xwtsp9xe1kjznjlt9';

const twitchClient = TwitchClient.withCredentials(clientId, accessToken);
const pubSubClient = new PubSubClient();

pubSubClient.registerUserListener(twitchClient,175541413);

//const tokenInfo = TwitchClient.getTokenInfo(accessToken);
//console.log(tokenInfo.userName);

pubSubClient.getUserListener('175541413');

pubSubClient.onRedemption(user, message => {
    console.log(message);
});
