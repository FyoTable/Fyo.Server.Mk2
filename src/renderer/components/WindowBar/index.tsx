import React, { PropsWithChildren } from 'react'

import styles from './styles.module.sass'

type WindowBar = PropsWithChildren<React.BaseHTMLAttributes<HTMLDivElement>>

export function WindowBar({ children, className, ...restOfProps }: WindowBar) {
  console.log(styles);

  const exit = () => {
    const {ipcRenderer} = window.require('electron')
    ipcRenderer.send('exit');
  }

  return (
    <div className={styles.windowBar}  {...restOfProps}>
        <div className={styles.row}>
            <div className={styles.toolbar}>
                <img src="/FyoLogoLong.png" />
            </div>
            <div className={styles.exitButton}>
                <a onClick={() => exit()}>X</a>
            </div>
        </div>
    </div>
  )
}
