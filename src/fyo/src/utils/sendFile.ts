import fs from 'fs';

const textFiles = ['.html', '.js', '.css'];
export default function sendFile(route: string, res) {
    if (fs.existsSync(route)) {
        var isDirectory = fs.lstatSync(route).isDirectory()
        if (isDirectory) {
            return sendFile(route + '/index.html', res);
        }

        let textFile = false;
        const lowerRoute = route.toLowerCase();
        textFiles.map((f) => {
            if (lowerRoute.endsWith(f)) {
                textFile = true;
            }
        })
        if (textFile) {
            fs.readFile(route, 'utf8', (err, buffer) => {
                res(buffer);
            });
        } else {
            fs.readFile(route, (err, buffer) => {
                res(buffer);
            });
        }
        return true;
    } else {
        return false;
    }
}