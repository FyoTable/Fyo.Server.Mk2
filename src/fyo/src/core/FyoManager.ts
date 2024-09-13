import Client from "../handlers/client";
import runApp from "../utils/runApp";
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
        app.on('AdminMsg', (msg: { event: string, data: any }) => {
            // send to all admins
            this.admins.forEach(admin => {
                admin.AdminMsg(msg.event, msg.data);
            });
        });
        app.on('disconnected', () => {

            console.log('App disconnected');

            // Tell controllers game disconnected
            this.AppEndMsg();

            // remove from apps list
            this.apps = this.apps.filter(a => a !== app);
            if (this.activeApp === app) {
                this.activeApp = undefined;
                if (this.apps.length > 0) {
                    this.activeApp = this.apps[0];
                    this.activeApp.Focused();
                }
                
                // update admins
                this.admins.forEach(admin => {
                    admin.AdminMsg('AppEndMsg', {
                        appId: this.activeApp?.appId
                    });
                });
            }
        });
        this.activeApp = app;
        this.apps.push(app);
        console.log(this.gamePads);
        this.gamePads.forEach(gamePad => { app.SGConnected(gamePad); });
        app.UpdateAdminInfo();
    }

    AppEndMsg() {
        if (this.activeApp) {
            this.activeApp.ended = true;
            // remove from array
            this.apps = this.apps.filter(a => a !== this.activeApp);

            if (this.apps.length == 0) {
                this.activeApp = undefined;
                console.error('No active app!');
                this.SGRedirectMsg({ SGID: -1, Controller: 'base_controller' });
            } else {
                this.activeApp = this.apps[0];
                this.activeApp.Focused();
            }
        }
    }

    RegisterGamePad(client: Client) {
        const gamePad = new GamePadClient(client, this.getNextSGID());
        this.gamePads.push(gamePad);
        gamePad.on('SGUpdateMsg', (data: SGUpdateMsg) => {

            if (data.MessageType === 'SGStartMsg') {
                console.log('SGStartMsg', data);
                const d: any = data;
                runApp(d.data.app);
                return;
            }
            console.log('FyoManager, SGUpdateMsg', data);
            // send to the active app
            if (this.activeApp) {
                this.activeApp.SendSGUpdateMsg(data);
            } else {
                console.error('Gamepad sent message but no active app');
            }

            // Send to admins
            this.admins.forEach(admin => {
                admin.AdminMsg('SGUpdateMsg', data);
            });
        });
        gamePad.on('SGDisconnectMsg', () => {
            this.gamePads.splice(this.gamePads.indexOf(gamePad), 1);
            // inform the active app
            if (this.activeApp) {
                this.activeApp.SGDisconnected(gamePad);
            } else {
                console.error('Gamepad disconnected but no active app');
            }
        });
        gamePad.on('AdminMsg', (msg: { event: string, data: any }) => {
            // send to all admins
            this.admins.forEach(admin => {
                admin.AdminMsg(msg.event, msg.data);
            });
        });
        if (this.gamePads.length === 1) {
            gamePad.SetPrimary();
        }
        this.gamePadMap[client.deviceId!] = gamePad;
        gamePad.Init();

        if (this.activeApp) {
            this.activeApp.SGConnected(gamePad);
        } else {
            console.error('GamePad connected but no active app');
        }
    }

    RegisterAdmin(client: Client) {
        const admin = new AdminClient(client, this);
        console.log('[Admin] Registering admin');
        this.admins.push(admin);

        // send all gamepads
        this.gamePads.forEach(gp => gp.UpdateAdminInfo());
    }

    SGRedirectMsg(data: SGRedirectMsg) {
        console.log('SGRedirectMsg from FyoManager', data);
        if (data.SGID === -1) {
            // Redirect all gamepads
            this.gamePads.forEach(gp => gp.Redirect(data.Controller));
            return;
        }
        // Find the gamepad
        const gamePad = this.gamePads.find(gp => gp.id === data.SGID);
        if (gamePad) {
            console.log('Redirecting controller to: ' + data.Controller);
            gamePad.Redirect(data.Controller);
        } else {
            console.error('Gamepad not found: ' + data.SGID);
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