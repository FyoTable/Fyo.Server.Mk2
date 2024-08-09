import { useContext, createContext, useState } from 'react'
import { io } from 'socket.io-client'

export interface WindowStore {
  about: {
    isOpen: boolean
    setAboutWindowState: (value: boolean) => void
  },
  conn: {
    socket: any,
    ipaddress: string[],
    controllers: string[],
    game: string,
    players: { DeviceId: string, ping?: number }[],
    messages: { message: string, data?: any }[],
    setSocket: (value: any) => void,
    connect: () => void
  }
}

const WindowStoreContext = createContext({} as WindowStore)

export function useWindowStore() {
  return useContext(WindowStoreContext)
}

export function WindowStoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const initializedMessages: { message: string, data?: any }[] = [];
  const initializedPlayers: { DeviceId: string, ping?: number }[] = [];
  const [state, setState] = useState({
    about: { isOpen: false, setAboutWindowState },
    conn: { socket: null, ipaddress: [], controllers: [], game: '', players: initializedPlayers, messages: initializedMessages, setSocket, connect },
  })

  function connect() {
    if (state.conn.socket) {
      return;
    }

    const URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
    const socket = io(URL);

    socket.on('connect', () => {
      console.log('connected');

      socket.emit('AdminHandshakeMsg', {
        code: 'Fyo1234'
      });

      socket.on('status', (data) => {
        console.log('status', data);
      });

      socket.on('ipaddresses', (data) => {
        console.log('ipaddresses', data);
        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            ipaddress: data,
          },
        }));
      });

      socket.on('controllers', (data) => {
        console.log('controllers', data);
        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            controllers: data,
          },
        }));
      });

      socket.on('status', (data) => {
        console.log('status', data);

        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            game: data.game,
            players: data.manager,
          },
        }));
      });


      socket.on('SGHandshakeIdentMsg', function (data) {
        console.log('controller joined', data);
        const players = state.conn.players;
        const messages = state.conn.messages;
        messages.unshift({
            message: 'SGHandshakeIdentMsg'
        });

        var found = false;
        for (var i = 0; i < players.length; i++) {
            if (players[i].DeviceId == data.DeviceId) {
                found = true;
                players[i] = data;
                break;
            }
        }
        if (!found) {
            players.push(data);
        }

        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            players,
            messages,
          },
        }));
    });

    socket.on('SGUpdateMsg', function (data) {
      const messages = state.conn.messages;
        messages.unshift({
            message: 'SGUpdateMsg',
            data: data
        });
        
        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            messages,
          },
        }));
    });

    socket.on('AppHandshakeMsg', function (data) {
        console.log(data);

        const messages = state.conn.messages;

        messages.unshift({
            message: 'AppHandshakeMsg',
            data: data
        });
        const game = data.AppIDString;
        
        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            game,
            messages,
          },
        }));
    });

    socket.on('GameEnd', function () {
      setState((state) => ({
        ...state,
        conn: {
          ...state.conn,
          game: '',
        },
      }));
    });

    socket.on('AppEndMsg', function () {
        const messages = state.conn.messages;
        messages.unshift({
            message: 'AppEndMsg'
        });
        const game = '';
        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            game,
            messages,
          },
        }));
    });
    socket.on('GameDisconnect', function () {
        const messages = state.conn.messages;
        messages.unshift({
            message: 'GameDisconnect'
        });
        const game = '';
        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            messages,
            game
          },
        }));
    });

    socket.on('app-latency', function (data) {
      const players = state.conn.players;
        for (var i = 0; i < players.length; i++) {
            if (players[i].DeviceId == data.DeviceId) {
                players[i].ping = Math.floor(data.average);
                break;
            }
        }
        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            players,
          },
        }));
    });

    socket.on('SGDisconnectMsg', function (data) {
      const players = state.conn.players;
        for (var i = 0; i < players.length; i++) {
            if (players[i].DeviceId == data.DeviceId) {
                players.splice(i, 1);
                break;
            }
        }
        setState((state) => ({
          ...state,
          conn: {
            ...state.conn,
            players,
          },
        }));
    });

      socket.on('SGRedirectMsg', function(data) {
        console.log('SGRedirectMsg', data);

      });
    });

    setSocket(socket);
  }

  function setSocket(value: any) {
    setState((state) => ({
      ...state,
      socket: value,
    }))
  }

  function setAboutWindowState(value: boolean) {
    setState((state) => ({
      ...state,
      about: {
        ...state.about,
        isOpen: value,
      },
    }))
  }

  return (
    <WindowStoreContext.Provider value={state}>
      {children}
    </WindowStoreContext.Provider>
  )
}
