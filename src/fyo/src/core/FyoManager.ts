import Client from "../handlers/client";
import AdminClient from "./AdminClient";
import ApplicationClient from "./ApplicationClient";
import GamePadClient from "./GamePadClient";
import { AppHandshakeMsg, SGRedirectMsg, SGUpdateMsg } from "./Messages";

export default class FyoManager {
    gamePads: GamePadClient[] = [];
    gamePadMap: { [key: string]: GamePadClient } = {};

    apps: ApplicationClient[] = [];
    activeApp?: ApplicationClient;

    admins: AdminClient[] = [];
    
    constructor() {
        
    }

    RegisterApp(client: Client, data: AppHandshakeMsg) {
        const app = new ApplicationClient(client, data);
        app.on('AppEndMsg', this.AppEndMsg.bind(this));
        app.on('SGRedirectMsg', this.SGRedirectMsg.bind(this));
        app.on('SGUpdateMsg', this.AppUpdateMsg.bind(this));
        this.activeApp = app;
        this.apps.push(app);
        this.gamePads.forEach(gamePad => { app.SGConnected(gamePad); });
    }

    AppEndMsg() {
        if (this.activeApp) {
            this.activeApp.ended = true;
            // remove from array
            this.apps = this.apps.filter(a => a !== this.activeApp);

            if (this.apps.length == 0) {
                this.activeApp = undefined;
                console.error('No active app!');
            } else {
                this.activeApp = this.apps[0];
                this.activeApp.Focused();
            }
        }
    }

    RegisterGamePad(client: Client) {
        const gamePad = new GamePadClient(client, this.getNextSGID());
        this.gamePads.push(gamePad);
        gamePad.on('SGDisconnectMsg', () => {
            this.gamePads.splice(this.gamePads.indexOf(gamePad), 1);
        });
        if (this.gamePads.length === 1) {
            gamePad.SetPrimary();
        }
        this.gamePadMap[client.deviceId!] = gamePad;

        if (this.activeApp) {
            this.activeApp.SGConnected(gamePad);
        } else {
            console.error('Client connected but no active app');
        }
    }

    RegisterAdmin(client: Client) {
        const admin = new AdminClient(client, this);
        this.admins.push(admin);
    }

    SGRedirectMsg(data: SGRedirectMsg) {
        // Find the gamepad
        const gamePad = this.gamePads.find(gp => gp.id === data.SGID);
        if (gamePad) {
            gamePad.Redirect(data.Controller);
        } else {
            console.error('Gamepad not found');
        }
    }

    AppUpdateMsg(data: { appId: string, data: SGUpdateMsg}) {
        if (this.activeApp?.appId != data.appId) {
            console.error('App ID mismatch:', data.appId, ' is not the active app');
            return;
        }
        
        // update all game pads
        this.gamePads.forEach(gp => gp.SGUpdateMsg(data.data));
    }

    getNextSGID() {
        for (var i = 0; i < this.gamePads.length; i++) {
            var takenCheck = false;
            for (var j = 0; j < this.gamePads.length; j++) {
                if (this.gamePads[j].id == i) {
                    takenCheck = true;
                    break;
                }
            }

            if (!takenCheck) {
                return i;
            }
        }

        return this.gamePads.length;
    }
}