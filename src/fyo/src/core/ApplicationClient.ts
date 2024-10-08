import Client from '../handlers/client';
import EventListener from '../utils/eventListener';
import colors from "colors";
import GamePadClient from './GamePadClient';
import { AppHandshakeMsg, SGRedirectMsg, SGUpdateMsg } from './Messages';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

// This is the Application Client handler that communicates with the FyoManager
export default class ApplicationClient extends EventListener {
    appId: string = '_';
    ended: boolean = false;
    appClient: Client;
    controller: string;

    constructor(client: Client, data: AppHandshakeMsg) {
        super();

        this.appClient = client;
        this.appId = data.AppIDString;
        this.controller = data.AppIDString;

        console.log(colors.green('[GAME START]'), this.appId);

        this.UpdateAdminInfo();

        // Messages from the Application
        this.appClient.on('AppEndMsg', this.AppEndMsg.bind(this));        
        this.appClient.on('SGRedirectMsg', this.SGRedirectMsg.bind(this));
        this.appClient.on('SGUpdateMsg', this.SGUpdateMsg.bind(this));
        this.appClient.on('disconnect', this.drop.bind(this));

        // Handle binary data
        this.HandleBinaryData(data).then(() => {
            this.SGRedirectMsg({ Controller: this.controller, SGID: -1 });

            // Tell the game that we've susccessfully connected
            console.log('finished handling Bindary Data');
            this.appClient.send('AppHandshakeMsg', {});
        });
    }

    drop() {
        this.ended = true;
        this.emit('disconnected');
    }

    SGConnected(gamePad: GamePadClient) {
        if (this.ended) return;

        // Tell the application that a gamepad has connected
        this.appClient.send('SGConnected', {
            SGID: gamePad.id,
            DeviceId: gamePad.client.deviceId,
            Controller: gamePad.controller,
            PlayerID: gamePad.client.playerId
        });

        // Tell the gamepad to connect to the controller
        gamePad.Redirect(this.controller);
    }

    SGDisconnected(gamePad: GamePadClient) {
        if (this.ended) return;

        // Tell the application that a gamepad has disconnected
        this.appClient.send('SGDisconnected', {
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
        console.log('tell fyo manager to redirect', data);
        // Tell the FyoManager that a gamepad should redirect to a different controller
        this.emit('SGRedirectMsg', data);
    }

    SGUpdateMsg(data: SGUpdateMsg) {
        // Tell the FyoManager that there's a new update message from the game
        this.emit('SGUpdateMsg', data);
    }

    SendSGUpdateMsg(data: SGUpdateMsg) {
        // Send a message to the game
        console.log('Send message to game', data);
        this.appClient.send('SGUpdateMsg', data);
    }

    Focused() {
        console.log(this.appId, 'focused');
        this.appClient.send('AppFocusMsg', {});
        this.SGRedirectMsg({ Controller: this.controller, SGID: -1 });
        this.UpdateAdminInfo();
    }

    UpdateAdminInfo() {
        this.emit('AdminMsg', { 
            event: 'AppHandshakeMsg', 
            data: {
                AppIDString: this.appId
            }
        });
    }

    HandleBinaryData(data: any) {
        return new Promise((resolve, reject) => {

            this.controller = data.Controller || this.appId;
            console.log('Application Controller: ', this.controller);
    
            if (data && data.BinaryData) {
                // Receive Controller Payload
                var buff = new Buffer(data.BinaryData, 'base64');
    
                var rootPath = path.resolve(__dirname + '/../../../../../uploads/');
                console.log('[Root Path] ', rootPath);
                if(!fs.existsSync(rootPath)) {
                    fs.mkdirSync(rootPath);
                }
    
                var gameFilesPath = path.resolve(__dirname + '/../../../../game_files/');
                console.log('[Game Files Path] ', gameFilesPath);
                var fullpath = path.resolve(gameFilesPath);
    
                fs.writeFile(fullpath, buff, "binary", (err) => {
                    if (err) {
                        console.log(colors.red('[ERROR]'), err);
                        return;
                    }
    
                    console.log(colors.green('[SUCCESS]'), 'written payload', fullpath);
    
                    var zip = new AdmZip(fullpath);
                    var p = path.resolve(__dirname + './../../../game_files/' + this.appId + '/');
    
                    console.log('[Extracting] ', p);
    
                    // make sure game_files path exists
                    if(!fs.existsSync(p)) {
                        fs.mkdirSync(p);
                    }
    
                    console.log(p);
                    zip.extractAllTo(p, /*overwrite*/true);
    
                    // delete the zip file
                    fs.unlinkSync(fullpath);
    
                    // Tell all gamepads to go to the games root controller
                    resolve(true);
                });
            }
        });
    }
}