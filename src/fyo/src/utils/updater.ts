const fs = require('fs');
const path = require('path');
const download = require('download');
const request = require('request');
const helpers = require('./helpers.js');
const config = require('./config.js');
const SU = require('./su.js');
const CMD = require('./cmd.js');
var Client = require('node-rest-client').Client;
var restClient = new Client();

export default class Updater{

    UpdateNodeServer() {
        return new Promise( (resolve, reject) => {
            CMD( 'git', [ 'pull' ] ).then( ( result ) => {
                // TODO: (garrett) If still up to date, just resolve, no npm or bower is needed
                CMD('npm', ['install']).then(resolve).catch(reject);
            }).catch(reject);
        });
    }

    async UpdateSoftware() {
        const portalConfig = await this.getPortalConfig();
        console.log('getPortalConfig', portalConfig);
        config.Update(portalConfig);

        const updates = await config.GetSoftwareToUpdate(portalConfig);
        
        await this.downloadAPKs( updates );
        
        await this.installAPKs( updates );

        config.Write();
    }

    installAPKs( software ) {
        return Promise.all(software.map(x => {
            console.log('install', x.url);

            return new Promise( async (resolve, reject ) => {
                // check if package installed
                const packages = await this.getPackages();
                if( packages.indexOf( x.package ) > -1) {
                    console.log(x.package, 'package is installed: reinstalling');

                    // uninstall it
                    await this.uninstallAPK(x.package);
                    console.log('Uninstalled package', x.id);

                    await this.installAPK(x.apk);
                    console.log('apk installed');
                    // update config
                    config.UpdateSoftware(x);
                    resolve(true);

                } else {
                        console.log( 'package is not installed');
                        // install it
                        
                        await this.installAPK(x.apk);
                        console.log('apk installed');
                        config.UpdateSoftware(x);
                        resolve(true);
                        
                }
            });
        }));

    }

    downloadAPKs( software ) {

        // Make sure directory exists
        const dir = path.resolve(__dirname + '/../../updates');
        console.log(dir);   
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        return Promise.all(software.map(x => {
                return new Promise( (success, reject ) => {
                    try {
                        download(process.env.PORTAL_ENDPOINT + '/apk/' + x.apk, dir).then( success ).catch( reject );
                    } catch( err ) {
                        console.log( 'Failed to download', err );
                        reject( err );
                    }
                });
            }
        ));

    }

    getPortalConfig( ) {
        return new Promise( (resolve, reject ) => {
            restClient.get('http://fyo.io/api/device/config/' + config.Get('id'), function( data, response) {
            console.log(data.toString());
            if(data) {
                    resolve( data );
                } else {
                    reject( response );
                }
            });
        });
    }


    oneLinerSU( cmd, cwd ): Promise<string> {
        return new Promise( ( success, reject ) => {
            var su = new SU();
            su.start((__dirname + '/../../updates/')).then( success ).catch( reject );
            su.run(cmd);
            su.exit();
        });
    }
    
    installAPK( apk ) {
        return new Promise(function(success, reject) {
            var su = new SU();
            su.start((__dirname + '/../../updates/')).then( success ).catch( reject );
            su.run('pm install "' + apk + '"');
            su.exit();
        });
    }
    
    uninstallAPK( apk ) {
        return new Promise(function(success, reject) {
            var su = new SU();
            su.start((__dirname + '/../../updates/')).then( success ).catch( reject );
            su.run('pm uninstall "' + apk + '"');
            su.exit();
        });
    }

    async getPackages() {
        const result: string = await this.oneLinerSU('pm list packages', null);
        let results = result.split('\n');
        return results.map(x => x.split('package:')[1]);
    }
};

module.exports = Updater;