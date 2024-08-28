import { spawn } from 'child_process';

export default class Cmd {
    cmd: string;
    args: string[];
    stdout: any;

    constructor(cmd: string, args: string[], stdout?: any) {
        this.cmd = cmd;
        this.args = args;
        this.stdout = stdout;
    }

    async run() {
        return new Promise( ( resolve, reject ) => {

            try {
                const run = spawn(this.cmd, this.args || []);
                run.on('error', ( err ) => {
                    console.log( 'Could not start ', this.cmd, err );
                });
                
                run.stdout.on('data', this.stdout || console.log);        
                run.stderr.on('data', console.error);
                
                run.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                if(code == 0) {
                    resolve( code );
                } else {
                    reject( code );
                }
                });
            } catch (e) {
                console.error(e);
                reject( e );
            }
        });
    }
}