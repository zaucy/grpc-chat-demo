// Built-in Modules
const {EventEmitter} = require("events");

// Dependency Modules
const grpc = require("grpc");
const jsonwebtoken = require("jsonwebtoken");

// Local modules
const {
  ChatService,
  LoginResponse,
  ChatMessage
} = require('@grpc-chat-demo/proto');

// Local module variables

const DEFAULT_CHANNEL = "general";

/**
 * Secret for jwt. Different everytime server runs. If the server restarts then
 * all existing clients tokens will be invalid.
 */
const jwtSecret = Math.random().toString();

/**
 * Emits an event when a sendMessage is invoked in channel
 */
const channelEmitters = new Map();

function getJwtDataFromMetadata(metadata) {
  const token = metadata.get('token').toString();

  if(!token) {
    return null;
  }

  try {
    const payload = jsonwebtoken.verify(token, jwtSecret);
    if(!payload) {
      return null;
    }
  
    return {
      username: payload.username || "",
      channel: payload.channel || ""
    };
  } catch(err) {
    return null;
  }
}

async function main() {

  let server = new grpc.Server();

  server.addService(ChatService, {
    login(call, callback) {
      const channel = DEFAULT_CHANNEL;
      const username = call.request.getUsername().trim();

      if(!username) {
        callback(new Error("Username may not be blank"));
      }

      const response = new LoginResponse();
      const token = jsonwebtoken.sign({username, channel}, jwtSecret);
      response.setAuthToken(token);

      callback(null, response);
    },

    sendMessage(call, callback) {
      const request = call.request;
      let jwtData = getJwtDataFromMetadata(call.metadata);

      if(!jwtData) {
        return callback(new Error('Not authenticated please login'));
      }

      if(!jwtData.channel) {
        return callback(new Error('Please join a channel'));
      }

      const {username, channel} = jwtData;

      if(!channelEmitters.has(channel)) {
        channelEmitters.set(channel, new EventEmitter());
      }

      const channelEmitter = channelEmitters.get(channel);
      const message = new ChatMessage();
      message.setAuthor(username);
      message.setText(request.getText());

      channelEmitter.emit('message', message);

      callback(null, message);
    },

    joinChannel(stream) {
      const channel = stream.request.getChannelName();

      if(!channel) {
        return stream.end();
      }

      if(!channelEmitters.has(channel)) {
        channelEmitters.set(channel, new EventEmitter());
      }

      const channelEmitter = channelEmitters.get(channel);
      const messageHandler = msg => stream.write(msg);

      channelEmitter.on('message', messageHandler);

      // Clean up
      stream.on('end', () => channelEmitter.off('message', messageHandler));
      stream.on('error', () => channelEmitter.off('message', messageHandler));
    }
  });

  const credentials = grpc.ServerCredentials.createInsecure();
  const port = server.bind('0.0.0.0:50030', credentials);
  server.start();

  console.log("Listening to port", port);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
