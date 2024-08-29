import { io, Socket } from 'socket.io-client';
import WebsocketHandler from './handlers/websocketHandler';
import { Config } from './utils/config';
import ProxyClient from './handlers/proxyClient';

export default class ProxyHandle {
    webRequestCallbacks: any[] = [];
    socket?: Socket;
    proxyClients: any = {};
    config: Config = new Config();

    websocketHandler: WebsocketHandler;

    constructor(websocketHandler: WebsocketHandler) {
        console.log('Start Proxy');
        this.websocketHandler = websocketHandler;
    }

    connect() {

        return new Promise((resolve, reject) => {
            console.log('[PROXY] Connecting to proxy');
            
            this.socket = io('http://fyoproxy.azurewebsites.net');
            this.socket.connect();
            this.socket.on('connect', () => {
                console.log('connected to proxy');
                this.socket!.emit('fyo-server', this.config.Get('id'));
                resolve(true);
            });
            this.socket.on("connect_error", (error) => {
                if (this.socket!.active) {
                  // temporary failure, the socket will automatically try to reconnect
                  console.log('connect_error', error);
                } else {
                  // the connection was denied by the server
                  // in that case, `socket.connect()` must be manually called in order to reconnect
                  console.log(error.message);
                }
              });

            this.socket.on('disconnect', () => {
                console.log('disconnected from proxy');
            });

            this.socket.on('error', (err) => {
                console.log('error', err);
                reject(err);
            });

            this.socket.on('request', (err, route, resCB) => {
                // console.log('request', route, resCB);
                this.webRequestCallbacks.map((cb) => cb(route, (data) => {
                    // console.log('Got data');
                    resCB && resCB(data);
                    // console.log(resCB);
                }));
            });


            this.proxy('AppHandshakeMsg');
            // proxy('SGHandshakeIdentMsg');
            
            this.socket.on(`SGHandshakeIdentMsg-Proxy`, (id, data) => {
                console.log('SGHandshakeIdentMsg!!', id);
                this.getClient(id).trigger('SGHandshakeIdentMsg', data);
            });
            this.proxy('app-pong');
            this.proxy('SGUpdateMsg');
            this.proxy('SGTimingOutMsg');
            this.proxy('SGDisconnectMsg');
            this.proxy('SGReconnectMsg');
            this.proxy('SGRedirectMsg');
            this.proxy('Games');
            this.proxy('info');
            this.proxy('Start');

            this.socket.on('Disconnect-Proxy', (id) => {
                console.log('disconnecting', id);
                if (this.proxyClients[id]) {
                    this.proxyClients[id].trigger('disconnect');
                    delete this.proxyClients[id];
                }
            });
        });
    }
    
    onWebRequest(cb) {
        this.webRequestCallbacks.push(cb);
    }

    getClient(id) {
        if (!this.proxyClients[id]) {
            this.proxyClients[id] = new ProxyClient(this.socket, id);
            console.log('Setting up', id);
            this.websocketHandler.setupClient(this.proxyClients[id]);
        }
        return this.proxyClients[id];
    }

    proxy(e: string) {
        this.socket!.on(`${e}-Proxy`, (id, data) => {
            this.getClient(id).trigger(e, data);
        });
    }

}

module.exports = ProxyHandle;