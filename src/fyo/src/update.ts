import Updater from "./utils/updater";
import CMD from "./utils/cmd";

function StartServer() {
    console.log('Start Server');
    const cmd = new CMD( 'node', [ 'src/index.js' ] );
    cmd.run()
        .then( () => console.log( 'child process exited with code ${code}' ) )
        .catch( ( code ) => {

            if( code === 50 ) { // Code 50 means an update has been requested
                console.log( 'UPDATE SERVER AND RESTART' );
                RunUpdateStart();
            }

        });
}

function RunUpdateStart() {
    var updater = new Updater();
    updater.UpdateNodeServer().then( () => {
        console.log('node server updated');
        updater.UpdateSoftware()
            .then( StartServer )
            .catch( (err) => {
                console.log( err );
                StartServer();
             });
    }).catch( (err) => {
        console.log( err );
        StartServer();
     });
}

RunUpdateStart();