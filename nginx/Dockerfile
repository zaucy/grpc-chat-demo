FROM nginx:1.14-perl

WORKDIR /grpc-chat-demo/nginx

# Self-signed certificates for testing
COPY fullchain.pem privkey.pem ./
COPY nginx.conf /etc/nginx/

EXPOSE 80 443
