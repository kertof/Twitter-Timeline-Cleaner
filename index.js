require('dotenv').config();
const db = require('diskdb');
const fs = require('fs');
const twitter = require('twitter');
const { Confirm, Select } = require('enquirer');

const client = new twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

const MAX_TWEETS_PER_REQUEST = 200;
const TWEET_SOURCE_REGEX = new RegExp('rel="nofollow">(.+?)</a>');

async function getAllTweets(max_id) {
  const tweets = await client.get('statuses/user_timeline', {
    screen_name: process.env.USERNAME,
    count: MAX_TWEETS_PER_REQUEST,
    include_rts: true,
    trim_user: true,
    max_id
  });
  const lightTweets = tweets.map(tweet => ({
    id_str: tweet.id_str,
    text: tweet.text,
    clean_source: TWEET_SOURCE_REGEX.exec(tweet.source)[1]
  }));
  db.tweets.save(lightTweets);
  console.log(`So far we have ${db.tweets.count()} tweets loaded up!`);

  const lastTweetId = tweets[tweets.length - 1].id_str;
  if (tweets.length > 1) {
    return getAllTweets(lastTweetId);
  } else {
    console.log('Thats it! All Tweets loaded.');
  }
}

function makeSourceMap() {
  const allTweets = db.tweets.find();
  let tweetSourceMap = {};
  allTweets.forEach(tweet => {
    tweetSourceMap[tweet.clean_source]
      ? tweetSourceMap[tweet.clean_source]++
      : (tweetSourceMap[tweet.clean_source] = 1);
  });
  console.table(tweetSourceMap);
  return tweetSourceMap;
}

function deleteTweets(source) {
  const tweets = db.tweets.find({ clean_source: source });
  tweets.forEach(tweet => {
    console.log('deleting tweet id: ', tweet.id_str);
    client.post('statuses/destroy/' + tweet.id_str, (err, res) => {
      if (err) {
        console.log(err);
      }
    });
  });
}

function printTweets(source) {
  const tweets = db.tweets.find({ clean_source: source });
  tweets.forEach(tweet =>
    console.log('https://twitter.com/user/status/' + tweet.id_str, tweet.text)
  );
}

async function promptSelectSource() {
  const prompt = await new Select({
    name: 'source',
    message: 'Pick a Source',
    choices: Object.keys(makeSourceMap())
  });
  return await prompt.run();
}

async function confirmDeleteSource(source) {
  const prompt = new Confirm({
    name: 'question',
    message: `Are you sure you want to deletes tweets from ${source}?`
  });
  return await prompt.run();
}

let main = async () => {
  db.connect('./db', ['tweets']);
  await getAllTweets();
  const source = await promptSelectSource();
  console.log('Source chosen: ', source);
  printTweets(source);
  const confirmation = await confirmDeleteSource(source);
  if (confirmation) {
    await deleteTweets(source);
  }

  // Cleanup after yourself.
  db.tweets.remove();
};

function handleError(err) {
  console.log('-------------');
  console.log('Error!');
  console.log(err);
}

main().catch(handleError);
