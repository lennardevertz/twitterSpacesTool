import express from 'express';
import {getRoomData, watchRoom} from "./roomTool.js";

const PORT = process.env.PORT || '3000'

const app = express()

app.set("port", PORT)

app.use(function (req, res, next) {
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080')
    res.setHeader('Access-Control-Allow-Origin', '*')
    next();
});

let watchingRooms = new Set();

app.get('*', async (req, res) => {
    console.log("Opened app")
    try {
        let params = req.path.split('/');
        let roomId = params[params.length - 1]
        if (!watchingRooms.has(roomId)) {
            watchingRooms.add(roomId);
            watchRoom(roomId).catch(ex=>null);
        }
        res.send(await getRoomData(roomId));
    } catch (e) {
        res.sendStatus(500)
    }
})

