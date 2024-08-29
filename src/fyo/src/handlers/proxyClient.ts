
export default class ProxyClient {
    conn: any;
    eventData: any;
    id: any;
    socket: any;

    constructor(socket, id) {
        this.socket = socket;
        this.id = id;
        this.conn = {
            transport: {
                name: 'Proxy'
            },
            on: () => {

            }
        };

        this.eventData = {};
    }
    
    on(e, cb) {
        this.eventData[e] = cb;
    };
    
    trigger(e, data) {
        console.log(e, data);
        if (this.eventData[e]) {
            this.eventData[e](data);
        }
    }

    emit(e, data) {
        // console.log(e, '=> Proxy =>', id);
        this.socket.emit(e, this.id, data);
    }

    disconnect() {
        console.log('disconnect socket');
    }
}