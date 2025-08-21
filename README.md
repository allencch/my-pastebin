# How to

Run

```
node pastebin.js
```

Run `ngrok`.

Then in some other environment,

```
echo "hello world" | curl -X POST --data-binary @- https://<NGROK_URL>/paste
```

You will get,

```
{"url":"/paste/abc123ef"}
```

To read the data in your local,

```
curl https://<NGROK_URL>/paste/abc123ef
```

You will get what you need
