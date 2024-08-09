import express from 'express';
import cors from 'cors';

import routesQR from './routes/qr';
import { Server } from 'http';
import ConnectionHandler from './handlers/connectionHandler';
import WebsocketHandler from './handlers/websocketHandler';
import FyoManager from './core/FyoManager';
import TCPHandler from './handlers/tcpHandler';

const PORT = 3000;

export default class WebServer {
    port: number;
    app: express.Application;
    server?: Server;
    handlers: ConnectionHandler[] = [];
    fyoManager: FyoManager;

    constructor(port?: number) {
        this.fyoManager = new FyoManager();

        this.port = port || PORT;
        this.app = express();
        this.app.all('/', function(_, res, next) {
            res.header("Cache-Control", "no-cache, no-store, must-revalidate");
            res.header("Pragma", "no-cache");
            res.header("Expires", '0');
            next();
        });
        this.app.use(cors());
        this.app.enable('trust proxy');
        this.app.options('*', cors());

        this.staticPaths();
        this.routes();
    }

    staticPaths() {
        console.log(__dirname);
        this.app.use(express.static(__dirname + '/res'));
        this.app.use(express.static(__dirname + '/../build'));
        this.app.use(express.static(__dirname + '/../../../game_files'));
    }

    routes() {
        this.app.get('/ping', (req, res) => {
            res.send('pong');
        });
        routesQR(this.app);
    }

    async start(): Promise<void> {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`Server is running on port ${this.port}`);

                // Setup websocket handler and tcp handler
                this.handlers.push(new WebsocketHandler(this.server!, this.fyoManager));
                this.handlers.push(new TCPHandler(this.fyoManager));

                resolve();
            });
        });
    }
}