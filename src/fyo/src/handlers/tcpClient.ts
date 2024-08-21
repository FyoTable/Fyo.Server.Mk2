import Client from "./client";
import net from 'net';
import colors from "colors";
import FyoManager from "../core/FyoManager";
import { AppHandshakeMsg } from "../core/Messages";

export default class TCPClient extends Client {
    socket: net.Socket;
    fyoManager: FyoManager;

    buffer: string = '';
    
    constructor(socket: net.Socket, fyoManager: FyoManager) {
        super();

        this.socket = socket;
        this.fyoManager = fyoManager;

        socket.on('data', (data) => {
            this.buffer += data.toString();
            this.process();
        });

        socket.on('end', () => {
            console.log(colors.yellow('[Disconnect]'), 'client dropped');
            this.emit('disconnect');
        });

        socket.on('AppHandshakeMsg', this.AppHandshakeMsg.bind(this));
        socket.on('AdminHandshakeMsg', this.AdminHandshakeMsg.bind(this));
        socket.on('SGHandshakeIdentMsg', this.SGHandshakeIdentMsg.bind(this));
        
        this.Latency();
    }

    listen(event: string, callback: any): void {
        this.on(event, callback);
    }

    processMessage(event: string, data: any) {
        
    }

    process() {
        var received = this.buffer.split('\n');
        while (received.length > 1) {
            console.log('Message Block: ', received[0]);

            // Parse the message
            try {
                var msg = JSON.parse(received[0]);
                this.socket.emit(msg.event, msg.data);
            } catch (e) {
                console.log('Error parsing message: ', e);
            }

            this.buffer = received.slice(1).join('\n');
            received = this.buffer.split('\n');
        }
    }

    send(event: string, ...args: any[]): void {
        super.send(event, ...args);
        this.sendMessage({event, ...args});
    }

    sendToAdmin(event: string, ...args: any[]): void {
        // this.io.to('admin').emit(event, ...args);
    }

    private Disconnect() {
        console.log(colors.yellow('[Disconnect]'), 'client dropped');
        this.emit('disconnect');
    }

    private AppHandshakeMsg(data: AppHandshakeMsg) {
        console.log('AppHandshageMsg', data);
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
        this.deviceId = data.deviceId;
        this.controller = data.controller;
        this.info = data.info;
        this.fyoManager.RegisterGamePad(this);
    }

    private sendMessage(data: any) {
        console.log('Sending: ', data, JSON.stringify(data));
        this.socket.write(JSON.stringify(data) + '\n');
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
            this.sendMessage({ event: 'app-latency', data: { average: averageLatency } });
        });

        // once per second, send a ping to the client
        setInterval(() => {
            this.socket.emit('app-ping', {
                d: (+new Date)
            });
        }, 1000);
    }

}