export interface SGUpdateMsg {
    SGID: number;
    DeviceId: string;
    MessageType: 'GameStarted' | 'Primary' | 'Redirect' | 'GameEnded';
}

export interface AppHandshakeMsg {
    AppIDString: string;

    // Base64 application data
    BinaryData: string;
}

export interface SGRedirectMsg {
    SGID: number;
    Controller: string;
}