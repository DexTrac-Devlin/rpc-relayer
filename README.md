# rpc-relayer
Dockerized RPC relayer

This is designed to provide an endpoint that will relay all RPC messages it receives to another endpoint.

---

## Dependencies:
[docker](https://docs.docker.com/engine/install/)


[openssl](https://www.openssl.org/source/)

---

## Directions:
1. Clone the repo 

`git clone https://github.com/DexTrac-Devlin/rpc-relayer.git`

2. Change into the new directory

`cd rpc-relayer`

3. Import cert and key for HTTPS, or generate a self-signed certificate
Example for self-signed cert:

_Be sure to update the provided openssl-00.cnf file._

`openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out tls/cert.pem -keyout tls/key.pem -config openssl-00.cnf -extensions req_ext`

4. Update the index.js:

* Change the port if you want something other than port 4000.

    * `const PORT_HTTPS = 4000;`
    * `const PORT_HTTP = 4001;`

* Change the AUTHENTICATION_KEY.

    * `const AUTHENTICATION_KEY = 'AUTH_KEY_CHANGE_ME';`

* Add the desired HTTP and Websocket URLs and the associated remote RPC endpoints.

    * `'rpc-endpoint-00': 'https://remote-rpc-endpoint-00/',`
    * `'rpc-endpoint-01': 'https://remote-rpc-endpoint-01/',`

    * `'ws-endpoint-00': 'wss://remote-ws-endpoint-00/',`
    * `'ws-endpoint-01': 'ws://remote-ws-endpoint-01/',`


* You can also adjust the timeout of the rpc relayer

    * `const RELAYER_HTTP_TIMEOUT = 20000;`

5. Build the contianer image:

`docker build -t rpc-relayer .`

6. Run the contianer:
`docker run --name rpc-relayer -p 4000:4000 -p 4001:4001 -d rpc-relayer`

---

## Using the RPC Relayer:

The below examples are using the temporary values in the default index.js.

#### Your endpoint will be available at:

`https://your-relay-dns-or-ip:4000/rpc/rpc-endpoint-00?apiKey=AUTH_KEY_CHANGE_ME`
`wss://your-relay-dns-or-ip:4000/rpc/rpc-endpoint-00?apiKey=AUTH_KEY_CHANGE_ME`


`http://your-relay-dns-or-ip:4001/rpc/rpc-endpoint-00?apiKey=AUTH_KEY_CHANGE_ME`
`ws://your-relay-dns-or-ip:4001/rpc/rpc-endpoint-00?apiKey=AUTH_KEY_CHANGE_ME`

and

`https://your-relay-dns-or-ip:4000/rpc/rpc-endpoint-01?apiKey=AUTH_KEY_CHANGE_ME`
`wss://your-relay-dns-or-ip:4000/rpc/rpc-endpoint-01?apiKey=AUTH_KEY_CHANGE_ME`

`http://your-relay-dns-or-ip:4001/rpc/rpc-endpoint-01?apiKey=AUTH_KEY_CHANGE_ME`
`ws://your-relay-dns-or-ip:4001/rpc/rpc-endpoint-01?apiKey=AUTH_KEY_CHANGE_ME`

#### Which will forward all inbound requests to:

`http(s)://remote-rpc-endpoint-00/`
`ws(s)://remote-rpc-endpoint-00/`

and

`http(s)://remote-rpc-endpoint-01/`
`ws(s)://remote-rpc-endpoint-01/`

respectively
