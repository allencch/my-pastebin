const http = require("http");
const { randomUUID } = require("crypto");

const store = {}; // in-memory storage

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/paste") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      const id = randomUUID().slice(0, 8); // short ID
      store[id] = body;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ url: `/paste/${id}` }));
    });

  } else if (req.method === "GET" && req.url.startsWith("/paste/")) {
    const id = req.url.split("/").pop();
    if (store[id]) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(store[id]);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }

  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
