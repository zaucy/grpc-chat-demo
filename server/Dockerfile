FROM grpc-chat-demo/proto:latest AS proto
FROM node:10

WORKDIR /grpc-web-chat/server

COPY --from=proto /grpc-web-chat/proto/ ../proto/

COPY package.json yarn.lock ./
RUN yarn --pure-lock

COPY ./ ./

CMD ["node", "src/main.js"]
