require("./styles.scss");

const localforage = require("localforage");
const grpc = require("@grpc-gen/grpc-web");

const {
  ChatClient,
  JoinChannelRequest,
  LoginRequest,
  ChatMessageRequest,
} = require("@grpc-chat-demo/proto/web");

const client = new ChatClient(location.origin);

const inputForm = document.querySelector('#input-form');
const inputEl = document.querySelector('#input');
const buttonEl = document.querySelector("#submit-btn");
const messagesEl = document.querySelector('#messages');
const metadata = {};

let username = "";
let channel = "";
let channelStream = null;

function disableInput(disabled) {
  buttonEl.disabled = disabled;
  inputEl.disabled = disabled;
}

function focusInput() {
  inputEl.focus();
}

function loadToken() {
  return localforage.getItem("token").then(storedToken => {
    metadata.token = storedToken;
  });
}

function storeToken() {
  localforage.setItem("token", metadata.token);
}

function writeMessage(author, message) {
  const msgEl = document.createElement("div");
  const msgContentEl = document.createElement("div");
  const authorEl = document.createElement("div");

  msgEl.classList.add("msg-wrap");
  authorEl.classList.add("author");
  msgContentEl.classList.add("msg");

  authorEl.textContent = author;
  msgContentEl.textContent = message;
  msgEl.appendChild(authorEl);
  msgEl.appendChild(msgContentEl);
  messagesEl.insertBefore(msgEl, messagesEl.firstElementChild);
}

function handleHelp() {
  writeMessage('[SYSTEM]', [
    '/login <username>',
    '/join <channel>',
  ].join('\n'));
}

function handleLogin(arg0) {
  username = arg0;

  const request = new LoginRequest();

  request.setUsername(username);

  client.login(request, metadata, (err, response) => {
    if(err) {
      writeMessage('[ERROR]', err.message);
    } else {
      writeMessage('[SYSTEM]', "Logged in as " + username);
      metadata.token = response.getAuthToken();;
      storeToken();
    }
  });
}

function handleJoin(arg0) {
  channel = arg0;

  const request = new JoinChannelRequest();
  request.setChannelName(channel);

  if(channelStream) {
    channelStream.cancel();
  }

  channelStream = client.joinChannel(request, metadata);

  writeMessage("Joined channel: " + channel);

  channelStream.on('status', (status) => {
    writeMessage('[SYSTEM]', 'status ' + status);
  });

  channelStream.on('data', msg => {
    writeMessage(msg.getAuthor(), msg.getText());
  });

  channelStream.on('error', (err) => {
    writeMessage('[ERROR]', err.message);
  });

  channelStream.on('end', () => {
    writeMessage('[SYSTEM]', 'Channel stream end');
  });
}

function handleCommand(command, args) {
  switch(command) {
    case 'help':
      return handleHelp();
    case 'login':
      if(args.length !== 1) {
        writeMessage('[SYSTEM]', 'usage: /login <username>');
        return;
      }
      return handleLogin(args[0]);
    case 'join':
      if(args.length !== 1) {
        writeMessage('[SYSTEM]', 'usage: /join <channel>');
        return;
      }
      return handleJoin(args[0]);
    case 'shrug':
      return sendMessage(`¯\\_(ツ)_/¯`);
    default:
      writeMessage('[SYSTEM]', `Unknown command '${command}'`);
  }
}

function sendMessage(msg) {
  const request = new ChatMessageRequest();
  request.setText(msg);

  const stream = client.sendMessage(request, metadata, (err) => {
    if(err) {
      writeMessage('[ERROR]', err.message);
    } else {
      // We should receive our own message from the join stream
    }
  });
}

disableInput(true);
Promise.all([
  handleJoin("general"),
  loadToken()
]).then(() => {
  disableInput(false);
  focusInput();
});

inputForm.onsubmit = (e) => {
  e.preventDefault();

  const value = inputEl.value;

  if(value[0] === '/') {
    let args = value.substr(1).split(/\s+/g);
    args = args.filter(arg => !!arg);
    args = args.map(arg => arg.trim());

    let command = args[0];
    args.splice(0, 1);
    handleCommand(command, args);
  } else {
    sendMessage(inputEl.value);
  }

  inputEl.value = "";
};
