import EventListener from "../utils/eventListener";

export default class Client extends EventListener {
    deviceId?: string;
    controller?: string;
    info?: any;
    messageId: number = 0;

    forcedDisconnect: boolean = false;

    constructor() {
        super();
    }

    addMessageID(data: any) {
        this.messageId++;
        data.messageId = this.messageId;
    }

    send(event: string, data: any) {
        this.addMessageID(data);
    }

    sendToAdmin(event: string, data: any) {
        
    }

    listen(event: string, callback: Function) {
        
    }
}