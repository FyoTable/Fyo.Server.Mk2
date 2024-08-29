const fs = require('fs');
const path = require('path');

export class Config {
    data: { id: string, name: string, config: any } = {
        id: 'UNSET',
        config: null,
        name: 'UNSET'
    };

    constructor() {
        this.Read();
    }
    
    Read() {
        var p = path.resolve(__dirname + "/../../config.json");

        if(fs.existsSync(p)) {
            let contents = fs.readFileSync(__dirname + "/../../config.json");
            try {
                this.data = JSON.parse(contents);
            } catch( err ){
                console.log( err );
                this.data = { id: 'UNSET', config: null, name: 'UNSET' };
            }
        } else {
            this.data = { id: 'UNSET', config: null, name: 'UNSET' };
        }
    }

    Write() {
        let contents = JSON.stringify(this.data);
        fs.writeFileSync(__dirname + "/../../config.json", contents);
    }

    Get(key) {
        return this.data[key];
    }

    Set(key, data) {
        this.data[key] = data;
    }

    UpdateSoftware( pkg ) {
        this.data.config = this.data.config || {};
        this.data.config.software = this.data.config.software || [];
        let match = this.data.config.software.findIndex( ( cs ) => {
            if( cs.id === pkg.id ) {
                return cs;
            }
        } );
        if(match >= 0) {
            this.data.config.software[match] = pkg;
        } else {
            this.data.config.software.push(pkg);
        }
    }

    GetSoftwareToUpdate( portalConfig ) {
        this.data.config = this.data.config || {};
        this.data.config.software = this.data.config.software || [];
        let currentSoftware = this.data.config.software;
        portalConfig = portalConfig || {};
        portalConfig.config = portalConfig.config || {};
        portalConfig.config.software = portalConfig.config.software || [];
        let portalSoftware = portalConfig.config.software;

        return new Promise( ( resolve, reject ) => {
    
            let result: any[] = [];
            portalSoftware.map( ( s ) => {
                // find matching current software
                let match = currentSoftware.find( ( cs ) => {
                    if( cs.id === s.id ) {
                        return cs;
                    }
                } );
    
                if( !match || match.version != s.version ) {
                    result.push( s );
                }
            });
    
            resolve( result );
        } );
    }

    Update( portalConfig ) {
        this.data.config = this.data.config || {};
        portalConfig = portalConfig || {};
        portalConfig.config = portalConfig.config || {};
        this.data.config.wireless = portalConfig.config.wireless;
        this.data.name = portalConfig.name;
    }
};

const config = new Config();
export default config;