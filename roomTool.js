import WebSocket from 'ws';
import fs from 'fs';
import fetch from 'node-fetch'

async function getMediaKey(roomId) {
console.log("Getting media key now for ", roomId)
    let variables = {
        "id": roomId,
        "isMetatagsQuery": false,
        "withSuperFollowsUserFields": true,
        "withDownvotePerspective": true,
        "withReactionsMetadata": false,
        "withReactionsPerspective": false,
        "withSuperFollowsTweetFields": true,
        "withReplays": true
    };
    let features = {
        "spaces_2022_h2_clipping": true,
        "spaces_2022_h2_spaces_communities": false,
        "dont_mention_me_view_api_enabled": true,
        "responsive_web_uc_gql_enabled": true,
        "vibe_api_enabled": true,
        "responsive_web_edit_tweet_api_enabled": true,
        "graphql_is_translatable_rweb_tweet_is_translatable_enabled": false,
        "standardized_nudges_misinfo": true,
        "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": false,
        "responsive_web_graphql_timeline_navigation_enabled": false,
        "interactive_text_enabled": true,
        "responsive_web_text_conversations_enabled": false,
        "responsive_web_enhance_cards_enabled": true
    };
    let request = await fetch("https://twitter.com/i/api/graphql/" + 'gMM94mZD6vm7pgAmurx0gQ' + "/AudioSpaceById?variables=" + encodeURIComponent(JSON.stringify(variables)) + "&features=" + encodeURIComponent(JSON.stringify(features)), {
        "headers": {

            "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",

            "content-type": "application/json",


            "x-guest-token": "1575148521354846212",
            "x-twitter-active-user": "yes",
            "x-twitter-client-language": "pl"

        },

        "credentials": "include"
    });
    console.log("Request: ", request)
    let data = await request.json()
    console.log("data: ", data)
    return data.data.audioSpace.metadata.media_key;
}


async function liveVideoStreamStatus(mediaKey = '28_156745544433103257') {
    return await (await fetch("https://twitter.com/i/api/1.1/live_video_stream/status/" + mediaKey, {
        "headers": {
            "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
            "x-guest-token": "1575148521354846212",
        },

    })).json()
}

async function accessChatPublic(mediaKey) {
    let chatToken = (await liveVideoStreamStatus(mediaKey)).chatToken;
    let request = await fetch('https://proxsee.pscp.tv/api/v2/accessChatPublic', {
        method: 'POST',
        headers: {
            'X-Periscope-User-Agent': 'Twitter/m5',
            'X-Attempt': 1,
            'X-Idempotence': +new Date(),
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            "chat_token": chatToken
        })
    })
    return await request.json()
}

export async function watchRoom(roomId) {
    let mediaKey = await getMediaKey(roomId);
    console.log("mediaKey: ", mediaKey)
    let stats;
    try {
        stats = fs.statSync('data/' + roomId + '.json')
    } catch (ex) {
        console.log(ex)
    }
    let file = fs.openSync('data/' + roomId + '.json', 'w+');
    let position = 3;
    if (stats) {
        position = stats.size - 1;
    } else {
        fs.writeSync(file, '[{}]');
    }
    var w = new WebSocket('wss://prod-chatman-ancillary-eu-central-1.pscp.tv/chatapi/v1/chatnow');
    w.onopen = async () => {
        let access_token = (await accessChatPublic(mediaKey)).access_token
        console.log("access_token: ", access_token)
        let m1 = {
            "payload": JSON.stringify({
                access_token: access_token
            }),
            "kind": 3
        };
        w.send(JSON.stringify(m1))
        let m2 = {
            "payload": JSON.stringify({
                "body": JSON.stringify({
                    "room": roomId
                }),
                "kind": 1
            }),
            "kind": 2
        }
        w.send(JSON.stringify(m2))
    }
    w.onmessage = e => {
        let data = JSON.parse(e.data)
        console.info(data.kind, JSON.parse(data.payload))
        let toWrite = ',' + JSON.stringify(JSON.parse(data.payload)) + ']';
        fs.writeSync(file, toWrite, position);
        position += toWrite.length - 1;
    }
    w.onclose = async e => {
        await fs.closeSync(file);
    }
}

function getRoomPeople(raw) {
    let ret = {};
    for (const x of raw) {
        if (x.sender) {
            ret[x.sender.user_id] = x.sender;
        }
    }
    return ret;
}

export async function getRoomData(roomId) {
    try {
        console.log("getting info for ", roomId)
        let file = await fs.promises.open('data/' + roomId + '.json', 'r');
        let rawBuffer = await fs.promises.readFile(file);
        let raw = JSON.parse(rawBuffer.toString('utf8'))
        let roomPeople = getRoomPeople(raw)
        return {raw, roomPeople}
    }catch (e) {
    console.log(e)
        return {raw:[], roomPeople:[]}
    }
}