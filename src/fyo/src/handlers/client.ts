import EventListener from "../utils/eventListener";

export default class Client extends EventListener {
    deviceId?: string;
    controller?: string;
    info?: any;

    forcedDisconnect: boolean = false;

    constructor() {
        super();
    }

    send(event: string, data: any) {
        
    }

    sendToAdmin(event: string, data: any) {
        
    }

    listen(event: string, callback: Function) {
        
    }
}