import path from "path";
import fs from 'fs';
import os from 'os';
import Client from "../handlers/client";
import EventListener from "../utils/eventListener";
import FyoManager from "./FyoManager";
import { SGRedirectMsg } from "./Messages";

export default class AdminClient extends EventListener {
    client: Client;

    fyoManager: FyoManager;

    constructor(client: Client, fyoManager: FyoManager) {
        super();

        this.client = client;
        this.fyoManager = fyoManager;

        this.status();
    }

    status() {
        // Send the current status of the server
        this.client.send('status', {
            manager: this.getConnected(),
            game: this.fyoManager.activeApp?.appId || ''
        });

        this.client.on('SGRedirectMsg', this.SGRedirectMsg.bind(this));
        this.client.on('controllers', this.SendAvailableControllers.bind(this));
        this.client.on('ipaddresses', this.SendIPAddresses.bind(this));

        this.SendAvailableControllers();
        this.SendIPAddresses();
    }

    SendAvailableControllers() {
        var upwardPath = '/../../..';
        var p = path.resolve(__dirname + upwardPath + '/game_files');
        const files = fs.readdirSync(p);
        // filter out files
        const result = files.filter(f => fs.lstatSync(p + '/' + f).isDirectory());
        this.client.send('controllers', result);
    }

    SendIPAddresses() {

        var ifaces = os.networkInterfaces();

        if (!ifaces) return;

        var addresses: string[] = [];

        Object.keys(ifaces).forEach(function (ifname) {
            var alias = 0;

            const interfaces = ifaces[ifname]

            if (interfaces === undefined) return;

            interfaces.forEach(function (iface) {
                if ('IPv4' !== iface.family) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                }

                // skip localhost
                if (iface.address == '127.0.0.1') {
                    return;
                }

                if (alias >= 1) {
                    // this single interface has multiple ipv4 addresses
                    //console.log(ifname + ':' + alias, iface.address);
                    addresses.push(iface.address);
                } else {
                    // this interface has only one ipv4 adress
                    //console.log(ifname, iface.address);
                    addresses.push(iface.address);
                }
                ++alias;
            });

        });

        this.client.send('ipaddresses', addresses);
    }

    // Tell a SocketGamePad to redirect to a different controller
    SGRedirectMsg(data: SGRedirectMsg) {
        this.fyoManager.SGRedirectMsg(data);
    }

    AdminMsg(event: string, data: any) {
        this.client.send(event, data);
    }

    private getConnected() {
        var result: any[] = [];

        this.fyoManager.gamePads.map(sg => result.push({
            DeviceId: sg.client.deviceId,
            SGID: sg.id,
            Controller: sg.controller,
            Primary: sg.primary,
            Info: sg.info
        }));

        return result;
    }
}