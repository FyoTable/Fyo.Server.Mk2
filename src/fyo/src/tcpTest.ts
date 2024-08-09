import net from 'net';
import EventListener from './utils/eventListener';

class TCPTester extends EventListener{
    buffer: string = '';

    socket: net.Socket;

    constructor() {
        super();

        this.socket = net.connect(8090, 'localhost', () => {
            console.log('connected');

            this.socket.on('data', (data) => {
                console.log(data.toString());
                this.buffer += data.toString();
                this.process();
            });

            this.emit('connected');

        })
    }

    protected sendMessage(data: any) {
        console.log('Sending: ', data);
        this.socket.write(JSON.stringify(data) + '\n');
    }

    process() {
        var received = this.buffer.split('\n');
        while (received.length > 1) {
            console.log('Message Block: ', received[0]);

            // Parse the message
            var msg = JSON.parse(received[0]);
            this.socket.emit(msg.event, msg.data);

            this.buffer = received.slice(1).join('\n');
            received = this.buffer.split('\n');
        }
    }
}

class TCPTesterApp extends TCPTester {
    constructor() {
        super();

        this.on('connected', () => {
            this.sendMessage({ event: 'AppHandshakeMsg', data: { AppIDString: 'TCPTester' } });
        });

        this.socket.on('AppHandshakeMsg', () => {
            console.log('App Handshake Complete');
            this.emit('started');
        });
    }
}

class TCPTesterGame extends TCPTester {
    deviceId: string = '_';
    constructor() {
        super();

        this.on('connected', () => {
            this.deviceId = this.genUniqueId();
            this.sendMessage({ event: 'SGHandshakeIdentMsg', data: { deviceId: this.deviceId } });
        });
    }

    genUniqueId() {
        var code = '';
        const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (var i = 0; i < 24; i++) {
            code += alphabet[Math.floor(Math.random() * (alphabet.length - 1))];
        }
        return code;
    }
}

const app = new TCPTesterApp();
app.on('started', () => {
    console.log('App Started');
    const game = new TCPTesterGame();
    game.on('started', () => {
        console.log('Game Started');
    });
});