import runApp from './utils/runApp';
import WebServer from './webServer';

const server = new WebServer(3000);

server.start().then(() => {
    runApp('io.DCCKLLC.FyoMarquee');
});