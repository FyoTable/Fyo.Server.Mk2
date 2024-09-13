import Client from '../handlers/client';
import EventListener from '../utils/eventListener';
import runApp from '../utils/runApp';
import { SGUpdateMsg } from './Messages';

export default class GamePadClient extends EventListener {

    client: Client;
    id: number = -1;
    primary: boolean = false;
    controller: string = 'base_controller';
    timingOut: boolean = false;
    reconnectTimer: any;
    info: any = { };

    constructor(client: Client, id: number) {
        super();

        this.id = id;

        this.client = client;
    }

    Init() {
        this.client.listen('SGUpdateMsg', this.SGUpdateMsg.bind(this));
        this.client.on('SGUpdateMsg', this.SGUpdateMsg.bind(this));
        this.client.on('SGTimingOutMsg', () => { });
        this.client.on('SGDisconnectMsg', () => { });
        this.client.on('SGReconnectMsg', () => { });
        this.client.on('disconnect', this.disconnect.bind(this));
        this.client.on('SGStartMsg', (data: { android: string, win: string}) => {
            console.log(data);
            runApp(data);
        });
        this.client.send('SGHandshakeMsg', { SGID: this.id, DeviceId: this.client.deviceId });
        this.client.send('SGHandshakeIdentMsg', { SGID: this.id, DeviceId: this.client.deviceId });
        this.UpdateAdminInfo();
    }

    SGUpdateMsg(data: SGUpdateMsg) {
        console.log('[GamePad] SGUpdateMsg', data);
        data.SGID = this.id;
        data.DeviceId = this.client.deviceId!;
        data.PlayerId = this.client.playerId;
        this.emit('SGUpdateMsg', data);
    }

    SetPrimary() {
        this.primary = true;
        this.client.send('SGUpdateMsg', {
            message: 'Primary',
            data: this.primary
        });
        this.UpdateAdminInfo
    }

    UpdateAdminInfo() {
        this.emit('AdminMsg', { 
            event: 'SGHandshakeIdentMsg', 
            data: {
                DeviceId: this.client.deviceId,
                SGID: this.id,
                Primary: this.primary,
                Controller: this.controller,
                Info: this.info,
                TimingOut: this.timingOut
            }
        });
    }

    Redirect(controller: string) {
        console.log('GamePad being told to redirect to controller: ' + controller);
        this.controller = controller;
        this.client.send('SGUpdateMsg', {
            message: 'Redirect',
            data: this.controller
        });
        this.client.send('SGRedirectMsg', {
            controller: this.controller
        });
        this.UpdateAdminInfo();
    }

    private disconnect() {
        if (this.client.forcedDisconnect) return;

        console.log('setting up reconnect timer');
        this.reconnectTimer = setTimeout(() => {

            // Full disconnect
            console.log('Reconnect timed out - full disconnect');
            
            this.emit('SGDisconnectMsg', {
                SGID: this.id,
                DeviceId: this.client.deviceId
            });

            this.client.send('SGDisconnectMsg', {
                SGID: this.id,
                DeviceId: this.client.deviceId
            });

            this.emit('AdminMsg', { event: 'SGDisconnectMsg', data: {
                SGID: this.id,
                DeviceId: this.client.deviceId
            }});

            // After 15 seconds full drop
        }, 15000);

        this.timingOut = true;
        this.emit('SGTimingOutMsg', {
            SGID: this.id,
            DeviceId: this.client.deviceId
        });
        this.emit('AdminMsg', { event: 'SGTimingOutMsg', data: {
            SGID: this.id,
            DeviceId: this.client.deviceId
        }});
        this.UpdateAdminInfo();
    }

}