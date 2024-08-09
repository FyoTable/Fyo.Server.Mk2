import { app } from 'electron'

import { makeAppSetup, makeAppWithSingleInstanceLock } from './factories'
import { MainWindow, registerAboutWindowCreationByIPC } from './windows'
import WebServer from '../fyo/src/webServer';

const server = new WebServer(3000);

makeAppWithSingleInstanceLock(async () => {
  await server.start();
  await app.whenReady()
  await makeAppSetup(MainWindow)

  registerAboutWindowCreationByIPC()
})
