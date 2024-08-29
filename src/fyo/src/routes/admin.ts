import { spawn } from 'child_process';
import express from 'express';
import path from 'path';
import process = require('process');
import config from '../utils/config';
import runApp from '../utils/runApp';

let updating = false;

export default function AdminRoutes(app: express.Application) {

    app.post('/config/:id', function(req, res) {
        config.data.config.id = req.params.id;
        config.Write();
        res.send('success');
    });

    app.get('/update', function(req, res) {
        res.sendFile(path.join(__dirname + '/update.html'));

        const p: any = process;
        p.env.updating = true;

        setTimeout(function() {
            process.exit(50);
        }, 1000);
    });

    app.get('/updating', function(req, res) {
        res.send({
            updating: process.env.updating
        });
    });

    app.get('/install/:app', function(req, res) {
        const ls = spawn('pm', ['install', req.params.app]);
        
        ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        
        ls.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
        
        ls.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        res.send('success');
    });


    app.get('/config', function(req, res) {
        res.send(config.data);
    });

    app.get('/start/:app', function(req, res) {
        runApp(req.params.app);
        res.send('success');
    });
}