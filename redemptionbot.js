//https://twitchtokengenerator.com/

const clientId = 'gp762nuuoqcoxypju8c569th9wz7q5';
const accessToken = '3wni1fh3pbm8jxnys4b6p51zto8n3k';
const clientSecret = '';
const refreshToken = 'doasdx8z5iq1or4wrummgh8epppzufik6g8i66ypz95kvwhg8s';
const channelId = '175541413';      // https://codepen.io/Alca/pen/yLBdjyb
 
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