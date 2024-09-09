import { ipcMain, shell } from 'electron'

import { registerWindowCreationByIPC } from 'main/factories'
import { IPC } from 'shared/constants'
import { MainWindow } from '..'

export function registerMainWindowOpenURLByIPC() {
  ipcMain.handle(IPC.WINDOWS.MAIN.OPEN_URL, async (_, link: string) => {

    // open URL with shell

    shell.openExternal(link)
  })
}
