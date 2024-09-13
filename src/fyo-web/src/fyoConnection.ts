import EventListener from "../../fyo/src/utils/eventListener";
import IOHelper from "./ioHelper";

export class FyoConnection extends EventListener {
    controller: string;
    io: any;
    helper: IOHelper;

    socket: any;

    constructor(io: any, controller: string, options: any) {
        super();

        if (!controller) {
            throw 'Controller must be specified';
        }

        this.helper = new IOHelper({
            orientation: this.orientation.bind(this),
            motion: this.motion.bind(this),
        });

        this.controller = controller;
        this.io = io;
        this.socket = this.io();
        this.socket.on('connect', this.onConnect.bind(this));
    }

    orientation(gamma: number, beta: number, alpha: number) {
        this.emit('orientation', gamma, beta, alpha);
    }

    motion(x: number, y: number, z: number) {
        this.emit('motion', x, y, z);
    }

    onConnect() {
        const info = this.helper.GetDeviceInfo();
        
        var href = window.location.href.split('/proxy/');
        if (href.length > 1) {
            // it is a proxy address
            var id = href[1].split('/');
            this.socket.emit('fyo-client', id[0]);
        }

        this.socket.emit('SGHandshakeIdentMsg', {
            DeviceId: this.getClientId(),
            Controller: this.controller,
            Info: info
        });
        this.emit('connected');


        this.socket.on('SGRedirectMsg', (data: { Controller: string, controller?: string }) => {
            console.log('SGRedirectMsg', data);
            if (data.controller == this.controller) {
                // we're already at this controller
                return;
            }
            var href = window.location.href.split('/proxy/');
            if (href.length > 1) {
                // it is a proxy address
                var id = href[1].split('/');
                window.location.href = '/proxy/' + id[0] + '/' + (data.Controller || data.controller)
            } else {
                window.location.href = '/' + (data.Controller || data.controller);
            }
        });

        this.socket.on('SGUpdateMsg', (msg: any) => {
            this.emit('SGUpdateMsg', msg);
            this.emit(msg.MessageType, msg.data);
        });

        this.socket.on('app-ping', (data: any) => {
            this.socket.emit('app-pong', data);
        });

        this.socket.on('app-latency', (data: any) => {
            this.emit('app-latency', data);
        });
    }

    getClientId() {
        var clientId = window.localStorage.getItem('clientId');
        if (!clientId) {
            clientId = this.genUniqueId();
            window.localStorage.setItem('clientId', clientId);
        }
        return clientId;
    }

    genUniqueId() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var code = '';
        for (var i = 0; i < 24; i++) {
            code += alphabet[Math.floor(Math.random() * (alphabet.length - 1))];
        }
        return code;
    }

    send(messageType: string, data: any) {
        this.socket.emit('SGUpdateMsg', {
            MessageType: messageType,
            data: data
        });
    }
}