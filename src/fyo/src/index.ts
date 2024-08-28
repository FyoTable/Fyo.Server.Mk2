import runApp from './utils/runApp';
import WebServer from './webServer';

const server = new WebServer(3000);

server.start().then(() => {
    console.log('[SERVER] started');
    runApp('io.DCCKLLC.FyoMarquee');
});