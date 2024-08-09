import qr from 'qr-image';

export default function (app: any) {
    app.get('/qr/http/:q', function (req, res) {
        var code = qr.image('http://' + req.params.q, { type: 'svg' });
        res.type('svg');
        code.pipe(res);
    });
    
    app.get('/qr/:q', function (req, res) {
        var code = qr.image(req.params.q, { type: 'svg' });
        res.type('svg');
        code.pipe(res);
    });
}