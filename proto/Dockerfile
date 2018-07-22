FROM node:10

WORKDIR /grpc-web-chat/proto

COPY package.json yarn.lock ./
RUN yarn --pure-lock

RUN chmod +x ./node_modules/grpc-gen/src/bin/protoc-gen-dummy.sh

COPY ./ ./

RUN yarn build
