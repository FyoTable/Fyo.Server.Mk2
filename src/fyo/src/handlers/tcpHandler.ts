import ConnectionHandler from "./connectionHandler";
import net from 'net';
import colors from "colors";
import TCPClient from "./tcpClient";
import FyoManager from "../core/FyoManager";

export default class TCPHandler extends ConnectionHandler {
    clients: TCPClient[] = [];

    fyoManager: FyoManager;

    constructor(fyoManager: FyoManager) {
        super();

        this.fyoManager = fyoManager;

        const server = net.createServer((socket) => {
            console.log('client connected');
            this.setupClient(socket);
        });

        // open tcp listener on port 8090
        server.listen(8090, () => {
            console.log('opened server on', server.address());
        });
    }

    setupClient(socket: net.Socket) {
        console.log(colors.green('[Connection]'), 'Socket connected via: TCP');

        const client = new TCPClient(socket, this.fyoManager);
        this.clients.push(client);
        client.on('disconnect', () => {
            this.clients.splice(this.clients.indexOf(client), 1);
        });
    }
}