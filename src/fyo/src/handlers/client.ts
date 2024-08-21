import EventListener from "../utils/eventListener";

export default class Client extends EventListener {
    deviceId?: string;
    controller?: string;
    info?: any;

    forcedDisconnect: boolean = false;

    constructor() {
        super();
    }

    send(event: string, ...args: any[]) {
        
    }

    sendToAdmin(event: string, ...args: any[]) {
        
    }

    listen(event: string, callback: Function) {
        
    }
}