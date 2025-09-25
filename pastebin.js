const http = require("http");
const { randomUUID } = require("crypto");

// In-memory storage for pasted content.
// This is a simple solution and will be cleared on server restart.
const store = {};

/**
 * Handles incoming POST requests to create a new paste.
 * @param {http.IncomingMessage} req The request object.
 * @param {http.ServerResponse} res The response object.
 */
function handlePostRequest(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    let contentToStore = body;

    // Check the Content-Type header to determine how to parse the body.
    const contentType = req.headers["content-type"];

    if (contentType && contentType.includes("application/json")) {
      try {
        const data = JSON.parse(body);
        if (data && typeof data.content === "string") {
          contentToStore = data.content;
        } else {
          // Respond with an error if the JSON is malformed or missing the 'content' key.
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid JSON format. Expected { content: 'my_data' }" }));
        }
      } catch (error) {
        // Handle JSON parsing errors.
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Failed to parse JSON body." }));
      }
    }

    // Generate a short ID and store the content.
    const id = randomUUID().slice(0, 8);
    store[id] = contentToStore;

    console.log(`New paste created with ID: ${id}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ url: `/paste/${id}` }));
  });  
}

/**
 * Handles incoming GET requests to retrieve a paste by ID.
 * @param {http.IncomingMessage} req The request object.
 * @param {http.ServerResponse} res The response object.
 */
function handleGetRequest(req, res) {
  const id = req.url.split("/").pop();
  if (store[id]) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(store[id]);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}

/**
 * Handles all other requests by responding with a 404 Not Found.
 * @param {http.ServerResponse} res The response object.
 */
function handleNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
}

/**
 * The main request handler for the HTTP server.
 * Routes requests to the appropriate handler function.
 * @param {http.IncomingMessage} req The request object.
 * @param {http.ServerResponse} res The response object.
 */
function requestHandler(req, res) {
  if (req.method === "POST" && req.url === "/paste") {
    handlePostRequest(req, res);
  } else if (req.method === "GET" && req.url.startsWith("/paste/")) {
    handleGetRequest(req, res);
  } else {
    handleNotFound(res);
  }
}

const server = http.createServer(requestHandler);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
