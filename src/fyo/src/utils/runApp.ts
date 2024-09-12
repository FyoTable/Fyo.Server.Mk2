import os from 'os';
import cmd from './cmd';
import execFile from 'child_process';

export default function runApp(app) {
    // if machine is android run the app
    const osPlatform = os.platform();
    
    if (osPlatform === 'android') {
        try {
            const result = new cmd('am', ['start', '--user', '0', '-a', 'android.intent.action.MAIN', app + '/.MainActivity']);
            result.run().catch(console.error);
        } catch (e) {
            console.error(e);
        }
    } else {
        // launch the windows app
        const pathToExe = app.win;
        execFile.exec(pathToExe, (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log(stdout);
        });
    }
}