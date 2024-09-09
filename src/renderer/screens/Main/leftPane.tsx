import styles from './styles.module.sass'
const { App } = window

import link from '../../../resources/public/icon-link.png'

export function LeftPane() {

  const address = '127.0.0.1';

  const openWeb = () => {
    var win = window.open(`http://${address}:3000`, '_blank');
    win!.focus();
  }

  const openExternal = (url: string) => {
    App.openURL(url);
    }

  return (
    <div className={styles.leftPane}>
        <div>
            <div className={styles.qr}>

                <div style={{padding: '20px'}}>
                    <img src={`http://localhost:3000/qr/http/${address}:3000`} />
                </div>
                <div className={styles.server}>
                    <label>Server/WebSocket</label>
                    <a className={styles.boxed} onClick={() => openWeb()}>http://{address}:3000</a>
                    <br />
                </div>
                <div className={styles.server}>
                    <label>TCP Endpoint</label>
                    <a className={styles.boxed} href="javascript:void(0);">http://{address}:8090</a>
                    <br />
                </div>
            </div>
            <div className={styles.linkBlock}>
                <img src={link} /> <a href="javascript:void(0);" onClick={() => openExternal('https://github.com/ghoofman/FyoGameTable.Controller.API')}>Github Web API</a>
                <br />
                <img src={link} /> <a href="javascript:void(0);" onClick={() => openExternal('https://github.com/ghoofman/FyoTable')}>Github Game Examples</a>
                <br />
                <img src={link} /> <a href="javascript:void(0);" onClick={() => openExternal('http://docs.fyo.com')}>Fyo Game Table Docs</a>
            </div>
        </div>
    </div>
  )
}
