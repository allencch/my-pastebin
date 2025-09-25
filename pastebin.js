const http = require("http");
const { randomUUID } = require("crypto");
const { URLSearchParams } = require('url');

// In-memory storage for pasted content.
// This is a simple solution and will be cleared on server restart.
const store = {};

/**
 * Parses multipart/form-data from a request body.
 * This is a basic implementation to extract the "content" field.
 * @param {string} body The raw request body string.
 * @param {string} boundary The boundary string from the Content-Type header.
 * @returns {string | null} The value of the "content" field, or null if not found.
 */
function parseMultipartFormData(body, boundary) {
  // Split the body by the boundary string
  const parts = body.split(`--${boundary}`);
  // Find the part that contains the "content" field
  for (const part of parts) {
    if (part.includes('name="content"')) {
      // Split the part by newlines to get the header and content
      const lines = part.split('\r\n');
      // The content is the last non-empty line
      const content = lines[lines.length - 2];
      return content.trim();
    }
  }
  return null;
}

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
    } else if (contentType && contentType.includes("application/x-www-form-urlencoded")) {
      // Use URLSearchParams to parse form data
      const params = new URLSearchParams(body);
      if (params.has('content')) {
        contentToStore = params.get('content');
      } else {
        // Handle the case where the 'content' key is missing
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid form data. Expected a 'content' key." }));
      }
    } else if (contentType && contentType.includes("multipart/form-data")) {
      const boundaryMatch = /boundary=([^\s;]+)/.exec(contentType);
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const content = parseMultipartFormData(body, boundary);
        if (content) {
          contentToStore = content;
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid multipart/form-data. Expected a 'content' field." }));
        }
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid multipart/form-data. Missing boundary." }));
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
