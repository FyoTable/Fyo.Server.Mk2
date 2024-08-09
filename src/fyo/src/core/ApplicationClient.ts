import Client from '../handlers/client';
import EventListener from '../utils/eventListener';
import colors from "colors";
import GamePadClient from './GamePadClient';
import { AppHandshakeMsg, SGRedirectMsg, SGUpdateMsg } from './Messages';

// This is the Application Client handler that communicates with the FyoManager
export default class ApplicationClient extends EventListener {
    appId: string = '_';
    ended: boolean = false;
    appClient: Client;

    constructor(client: Client, data: AppHandshakeMsg) {
        super();

        this.appClient = client;
        this.appId = data.AppIDString;

        console.log(colors.green('[GAME START]'), this.appId);

        this.UpdateAdminInfo();

        // Messages from the Application
        this.appClient.on('AppEndMsg', this.AppEndMsg.bind(this));        
        this.appClient.on('SGRedirectMsg', this.SGRedirectMsg.bind(this));

        // Handle binary data
        
        // Tell the application that we've susccessfully connected
        this.appClient.send('AppHandshakeMsg', {});
    }

    SGConnected(gamePad: GamePadClient) {
        if (this.ended) return;

        // Tell the application that a gamepad has connected
        this.appClient.send('SGConnected', {
            SGID: gamePad.id,
            DeviceId: gamePad.client.deviceId,
            Controller: gamePad.controller,
        });
    }

    AppEndMsg() {
        // Let the Fyo Manager know that the application is ending
        this.emit('AppEndMsg');
    }

    SGRedirectMsg(data: SGRedirectMsg) {
        // Tell the FyoManager that a gamepad should redirect to a different controller
        this.emit('SGRedirectMsg', data);
    }

    Focused() {
        this.appClient.send('AppFocusMsg', {});
        this.UpdateAdminInfo();
    }

    UpdateAdminInfo() {
        this.appClient.sendToAdmin('AppHandshakeMsg', {
            AppIDString: this.appId
        });
    }
}