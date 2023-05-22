const fs = require('fs');
const { Client, Intents } = require('discord.js');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

const voiceTimers = new Map();
const voiceStatistics = new Map();
const jsonFilePath = 'userTime.json';

if (fs.existsSync(jsonFilePath)) {
    const data = fs.readFileSync(jsonFilePath, 'utf8');
    if (data) {
      const parsedData = JSON.parse(data);
      if (typeof parsedData === 'object') {
        for (const [userId, totalTime] of Object.entries(parsedData)) {
          voiceStatistics.set(userId, totalTime);
        }
      }
    }
  }

  function saveDataToFile() {
    const jsonData = JSON.stringify(Object.fromEntries(voiceStatistics));
    fs.writeFileSync(jsonFilePath, jsonData, 'utf8');
    console.log('Data SAVED');
  }
  const saveInterval = setInterval(saveDataToFile, 1000);
 client.on('ready', () => {
    clearInterval(saveInterval);
    saveDataToFile();

 });



client.once('ready', () => {

  process.on('SIGINT', () => {
    clearInterval(saveInterval);
    saveDataToFile();
    console.log('Shutting down...');
    process.exit();
  });

  console.log(`Logged in as ${client.user.tag}`);
  
});

client.on('messageCreate', (message) => {


  if (message.content === '/cas') {
    const user = message.author;
    let totalElapsedTime = 0;
    if (voiceStatistics.has(user.id)) {
      totalElapsedTime = voiceStatistics.get(user.id);
    }
    
    const formattedTime = formatTime(totalElapsedTime);
    message.channel.send(`Celkem promarněný čas: ${formattedTime}`);
  }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const user = oldState.member;
  
    if (!user.user.bot) {
      if (oldState.channelId && !newState.channelId) {
        if (voiceTimers.has(user.id)) {
          const elapsedTime = Math.floor((Date.now() - voiceTimers.get(user.id)) / 1000);
          voiceTimers.delete(user.id);
  
          let totalElapsedTime = 0;
          if (voiceStatistics.has(user.id)) {
            totalElapsedTime = voiceStatistics.get(user.id);
          }
          totalElapsedTime += elapsedTime;
          voiceStatistics.set(user.id, totalElapsedTime);
  
          console.log(`${user.displayName} left voice chat. Time elapsed: ${elapsedTime} seconds.`);
          saveDataToFile();
        }
      } else if (newState.channelId && !oldState.channelId) {
        voiceTimers.set(user.id, Date.now());
        console.log(`${user.displayName} joined voice chat.`);
      }
    }
  });
  
 
  setInterval(() => {
    voiceTimers.forEach((startTime, userId) => {
      let totalElapsedTime = 0;
      if (voiceStatistics.has(userId)) {
        totalElapsedTime = voiceStatistics.get(userId);
      }
      totalElapsedTime += 1; // Add 1 second every second
      voiceStatistics.set(userId, totalElapsedTime);
  
      console.log(`${userId} - Elapsed time: ${totalElapsedTime} seconds`);
    });
  
    saveDataToFile();
  }, 1000);




function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedSeconds = Math.floor(remainingSeconds);

  if (seconds < 60) {
    if (seconds < 5 && seconds > 1) {
      return `${formattedSeconds} vteřiny`;
    } else {
      return `${formattedSeconds} vteřin`;
    }
  }

  if (minutes < 60) {
    return `${minutes} minut a ${formattedSeconds} sekund`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hours, ${remainingMinutes} minutes, and ${formattedSeconds} seconds`;
  }
}


client.login('MTEwNjYzMDIxMjgxNDM4MTE3Nw.GALub0.X61YbeNOJs6r19zwQZXoQQlmSrXyt7rTwVJSGw');
