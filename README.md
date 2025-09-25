# How to

Run

```
node pastebin.js
```

Run `ngrok`.

Then in some other environment, to send plain text:

```
echo "hello world" | curl -X POST --data-binary @- https://<NGROK_URL>/paste
```

To send JSON data:

```
curl -X POST -H "Content-Type: application/json" -d '{"content": "This is my JSON data."}' https://<NGROK_URL>/paste

```

To send `form-urlencoded data`:

```
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d 'content=This+is+my+form+data.' https://<NGROK_URL>/paste
```

To send `multipart/form-data`:

```
curl -X POST -H "Content-Type: multipart/form-data" -F "content=This is my multipart data." https://<NGROK_URL>/paste
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
