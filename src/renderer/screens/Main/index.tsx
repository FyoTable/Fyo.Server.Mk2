import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

import { Container, Heading, Button } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { io } from 'socket.io-client';

import styles from './styles.module.sass'
import { LeftPane } from './leftPane';

// The "App" comes from the context bridge in preload/index.ts
const { App } = window

export function MainScreen() {
  const navigate = useNavigate()
  const store = useWindowStore().about;
  const connStore = useWindowStore().conn;
  const socketStore = useWindowStore().socket;

  useEffect(() => {
    App.sayHelloFromBridge()

    App.whenAboutWindowClose(({ message }) => {
      console.log(message)

      store.setAboutWindowState(false)
    })

    const URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

    connStore.connect();

  }, [])

  function openAboutWindow() {
    App.createAboutWindow()
    store.setAboutWindowState(true)
  }

  const redirect = (SGID: string, val: string) => {
    socketStore!.emit('SGRedirectMsg', { SGID, Controller: val });
  }

  const address = '127.0.0.1';

  return (
    <div className={styles.main}>
      <div className={styles.mainContent} >

        <LeftPane />
        <div className={styles.rightPane}>
          <h2>State: { (connStore.socket !== undefined) ? 'connected' : 'disconnect' }</h2>

          <div>
            <h2>Game: { connStore.game }</h2>
          </div>

          <div>
            <h2>Players</h2>
            <table>
              <thead>
                <tr>
                  <th>SGID</th>
                  <th>Controller</th>
                  <th>Ping</th>
                </tr>
              </thead>
              <tbody>
                { connStore.players.map((player, index) => (
                  <tr key={index}>
                    <td>{player.SGID}</td>
                    <td>
                      <select value={player.Controller} onChange={(e) => redirect(player.SGID, e.target.value)}>
                        { connStore.controllers.map((controller, index) => (
                          <option key={controller} value={controller}>{controller}</option>
                        )) }
                      </select>
                    </td>
                    <td>{ player.ping } { player.TimingOut && 'Timing Out'}</td>
                  </tr>
                )) }
              </tbody>
            </table>
          </div>

          <div>
            <h2>Messages</h2>
            <div>
              { connStore.messages.map((message, index) => (
                <div key={index}>{message.message}</div>
              )) }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
