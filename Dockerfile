FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY tls/cert.pem cert.pem
COPY tls/key.pem key.pem
COPY . .
EXPOSE 4000
CMD [ "node", "index.js" ]
