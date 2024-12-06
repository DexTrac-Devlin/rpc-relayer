FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY tls/cert.pem /usr/src/app/tls/cert.pem
COPY tls/key.pem /usr/src/app/tls/key.pem
COPY . .
EXPOSE 4000 4001
CMD ["node", "index.js"]
