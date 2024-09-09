import { ipcRenderer } from 'electron'

import { IPC } from 'shared/constants'

export function openURL(link: string) {
  const channel = IPC.WINDOWS.MAIN.OPEN_URL

  ipcRenderer.invoke(channel, link)
}
