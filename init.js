import express from 'express';
import {getRoomData, watchRoom} from "./roomTool.js";

const app = express()
const port = 3000

app.use(function (req, res, next) {
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080')
    res.setHeader('Access-Control-Allow-Origin', '*')
    next();
});

let watchingRooms = new Set();

app.get('*', async (req, res) => {
    try {
        let [_, roomId] = req.path.split('/');
        if (!watchingRooms.has(roomId)) {
            watchingRooms.add(roomId);
            watchRoom(roomId).catch(ex=>null);
        }
        res.send(await getRoomData(roomId));
    } catch (e) {
        res.sendStatus(500)
    }
})


const server = app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
