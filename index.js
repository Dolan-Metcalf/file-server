import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send('health check');
});

app.get('/directory', (req, res) => {
    const dirPath = req.query.path || '.';

    const transformStream = new Transform({
        objectMode: true,
        transform(file, encoding, callback) {
            const filePath = path.join(dirPath, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    return callback(err);
                }
                const fileDetails = {
                    name: file,
                    path: filePath,
                    size: stats.size,
                    type: stats.isDirectory() ? 'directory' : 'file',
                    extension: path.extname(file),
                    createdDate: stats.birthtime,
                    permissions: stats.mode,
                };
                callback(null, `data: ${JSON.stringify(fileDetails)}\n\n`);
            });
        }
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        files.forEach(file => transformStream.write(file));
        transformStream.end();
    });

    transformStream.pipe(res);
});

const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
