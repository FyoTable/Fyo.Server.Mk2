import { Server as HttpServer } from "http";
import ConnectionHandler from "./connectionHandler";
import { Socket, Server as SocketIOServer } from "socket.io";
import FyoManager from "../core/FyoManager";
import colors from "colors";
import WebSocketClient from "./webSocketClient";

export default class WebsocketHandler extends ConnectionHandler {
    io: SocketIOServer;
    clients: WebSocketClient[] = [];
    fyoManager: FyoManager;

    constructor(httpServer: HttpServer, fyoManager: FyoManager) {
        super();

        this.fyoManager = fyoManager;

        this.io = new SocketIOServer(httpServer, {
            cors: {
              origin: "*"
            }
        });
        this.io.on('connection', this.setupClient.bind(this));
    }

    setupClient(socket: Socket) {
        console.log(colors.green('[Connection]'), 'Socket connected via: ' + socket.conn.transport.name);
        console.log('a user connected');

        this.io.to('admin').emit('Connection', socket.conn.transport.name);

        const client = new WebSocketClient(this.io, socket, this.fyoManager);
        this.clients.push(client);
        client.on('disconnect', () => {
            this.clients.splice(this.clients.indexOf(client), 1);
        });
    }
}