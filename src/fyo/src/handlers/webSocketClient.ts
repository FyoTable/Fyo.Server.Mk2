import Client from "./client";
import colors from "colors";
import { Socket, Server as SocketIOServer } from "socket.io";
import FyoManager from "../core/FyoManager";

export default class WebSocketClient extends Client {
    io: SocketIOServer;
    socket: Socket;
    fyoManager: FyoManager;
    
    constructor(io: SocketIOServer, socket: Socket, fyoManager: FyoManager) {
        super();

        this.io = io;
        this.socket = socket;
        this.fyoManager = fyoManager;

        socket.on('AppHandshakeMsg', this.AppHandshakeMsg.bind(this));
        socket.on('AdminHandshakeMsg', this.AdminHandshakeMsg.bind(this));
        socket.on('SGHandshakeIdentMsg', this.SGHandshakeIdentMsg.bind(this));
        
        socket.conn.on('upgrade', function (transport) {
            console.log(colors.yellow('[Upgrade]'), 'Transport changed: ', socket.conn.transport.name);
        });

        socket.on('disconnecting', (err) => {
            console.log(colors.yellow('[Disconnecting]'), 'client dropping', err);
        });

        socket.on('connect', (err, data) => {
            console.log(colors.green('[Connection]'), 'Connected');
        });

        socket.on('error', (err) => {
            console.log(colors.red('[Error]'), err);
        });

        socket.on('disconnect', this.Disconnect.bind(this));

        socket.on('chat message', (msg: string) => {
            console.log('message: ' + msg);
        });

        this.Latency();
    }

    listen(event: string, callback: any): void {
        this.socket.on(event, callback);
    }

    send(event: string, ...args: any[]): void {
        super.send(event, ...args);
        this.socket.emit(event, ...args);
    }

    sendToAdmin(event: string, ...args: any[]): void {
        this.io.to('admin').emit(event, ...args);
    }

    private Disconnect() {
        console.log(colors.yellow('[Disconnect]'), 'client dropped');
        this.emit('disconnect');
    }

    private AppHandshakeMsg(data: any) {
        this.fyoManager.RegisterApp(this, data);
    }

    private AdminHandshakeMsg(data: any) {
        if (data.code != 'Fyo1234') {
            // You're not the donut man, get out.
            console.log(colors.red('YOU DONT GET TO JOIN'));
            return;
        }
        
        this.fyoManager.RegisterAdmin(this);
    }

    private SGHandshakeIdentMsg(data: any) {
        console.log('SGHandshakeIdentMsg', data);
        this.deviceId = data.deviceId;
        this.controller = data.controller;
        this.info = data.info;
        this.fyoManager.RegisterGamePad(this);
    }

    private Latency() {

        /*
        /   Latency checks between sockets and the server
        */
        const latencyChecks: number[] = [];

        const rollingChecks = 3;
        var latencyInd = 0;
        for(var i = 0; i < rollingChecks; i++) {
            latencyChecks[i] = 0;
        }
        this.socket.on('app-pong', (data) => {
            var now = +new Date;

            latencyChecks[latencyInd % rollingChecks] = (now - data.d);
            latencyInd++;

            var sum = 0;
            for (var i = 0; i < rollingChecks; i++) {
                sum += latencyChecks[i];
            }
            const averageLatency = sum / rollingChecks;
            this.socket.emit('app-latency', {
                average: averageLatency
            });
            this.io.to('admin').emit('app-latency', {
                DeviceId: this.deviceId,
                average: averageLatency
            });
        });

        // once per second, send a ping to the client
        setInterval(() => {
            this.socket.emit('app-ping', {
                d: (+new Date)
            });
        }, 1000);
    }

}