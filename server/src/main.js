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
  const token = metadata.get('token');
  const payload = jsonwebtoken.verify(token, jwtSecret);

  if(!payload) {
    return null;
  }

  return {
    username: payload.username || "",
    channel: payload.channel || ""
  };
}

async function main() {

  let server = new grpc.Server();

  server.addService(ChatService, {
    login(call, callback) {
      const username = call.request.getUsername();

      if(!username) {
        callback(new Error("Username may not be blank"));
      }

      const response = new LoginResponse();
      const token = jsonwebtoken.sign({username}, jwtSecret);
      const responseMetadata = new grpc.Metadata();

      responseMetadata.set('token', token);

      callback(null, response, responseMetadata);
    },

    sendMessage(call, callback) {
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
      let jwtData = getJwtDataFromMetadata(stream.metadata);

      if(!jwtData) {
        return stream.end();
      }

      const channel = stream.request.getChannelName();

      if(!channel) {
        return stream.end();
      }

      const {username} = jwtData;
      const token = jsonwebtoken.sign({username, channel}, jwtSecret);
      const responseMetadata = new grpc.Metadata();
      responseMetadata.set('token', token);
      stream.sendMetadata(responseMetadata);

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
