# Twitch-Channel-Point-Redemption-Bot
Twitch chatbot that monitors a channel's reward redemptions.

Setup guide included in PDF file.

Current features:
  - Takes in two external csv configuration files for access keys and OBS data for automation.
  - Connects to Twitch's IRC chat servers to monitor a channel's chat room.
  - Connects to OBS via OBS-Web-Socket to retrieve scene and source data.
  - Queue system implemented to keep chat monitored and keep all redemptions accounted.
  - Logging will be done in the console for received and completed redemptions and error messages.
  - Returns error messages if the OBS data in the csv configuration file does not match the OBS data.
  - Automatically turns on the visibility of the source defined in csv for the specified duration and turns invinsible once it has been played.
  - Chatbot will appear in chat to specify that a redemption is being played when it becomes the next in queue.
  - Submode can be activated by mods or broadcaster for chat message driven automation.
  - Chat messages will be monitored for key commands to trigger OBS scenes. (A specified cooldown period will ignore other chat requests until it is lapsed.)
