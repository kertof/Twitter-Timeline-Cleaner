# Twitter Timeline Cleaner

I realized my twitter timeline is full of junk, auto-posts from obscure apps, instagram x-posts,...
With this, I can see from where my tweets come from, and delete batches of tweets based on a Tweet source.

## Requirements

- Node.js
- Twitter dev keys (more below)

## Twitter Dev Keys

You'll need a developer keys from twitter → <https://developer.twitter.com/en/apps> - this is a tricky process, you need to provide a reason and what you plan on doing.

Create your `.env` file like this:

```bash
cp example.env .env
```

Fill in the information needed, your twitter username, and the Twitter keys you got.

Run the script with `npm start`.
