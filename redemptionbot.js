//https://twitchtokengenerator.com/

const clientId = 'gp762nuuoqcoxypju8c569th9wz7q5';
const accessToken = '7hq6qxxv06iovje7oq42og253rxj3b';
const clientSecret = '';
const refreshToken = 'm541bkapkfyk1688uc00ju1232vtlvt0uq7f3osh5o215axeg6';
const channelId = '175541413';
 
const PubSubClient = require('twitch-pubsub-client').default;
const request = require("request");
const TwitchClient = require('twitch').default;
 
const run = async () => {
    const twitchClient = TwitchClient.withCredentials(clientId, accessToken, undefined, {clientSecret, refreshToken, onRefresh: async (t) => {
 
    }});
   
    const pubSubClient = new PubSubClient();
    await pubSubClient.registerUserListener(twitchClient);
 
    pubSubClient.onRedemption(channelId, (message) => {
        console.log(message);
    });
}
 
run();