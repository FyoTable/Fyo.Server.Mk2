import EventListener from "../utils/eventListener";

export default class Client extends EventListener {
    deviceId?: string;
    controller?: string;
    info?: any;
    messageId: number = 0;
    playerId: number = -1;

    forcedDisconnect: boolean = false;

    constructor() {
        super();
    }

    addMessageID(data: any) {
        this.messageId++;
        data.messageId = this.messageId;
        data.deviceId = this.deviceId;
        data.playerId = this.playerId;
    }

    send(event: string, data: any) {
        this.addMessageID(data);
    }

    sendToAdmin(event: string, data: any) {
        
    }

    listen(event: string, callback: Function) {
        
    }
}