const WebSocket = require('ws');
const fs = require('fs');
const fetch = require('node-fetch')

async function getMediaKey(roomId) {
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
    let request = await fetch("https://twitter.com/i/api/graphql/" + 'gMM94mZD6vm7pgAmurx0gQ' + "/AudioSpaceById?variables=" + encodeURIComponent(JSON.stringify(variables))+"&features="+ encodeURIComponent(JSON.stringify(features)), {
        "headers": {

            "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",

            "content-type": "application/json",


            "x-guest-token": "1570786534533521410",
            "x-twitter-active-user": "yes",
            "x-twitter-client-language": "pl"

        },

        "credentials": "include"
    });
    let data = await request.json()
    return data.data.audioSpace.metadata.media_key;
}


async function liveVideoStreamStatus(mediaKey = '28_156745544433103257') {
    return await (await fetch("https://twitter.com/i/api/1.1/live_video_stream/status/" + mediaKey, {
        "headers": {
            "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
            "x-guest-token": "1567457075399196672",
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

async function watchRoom(roomId) {
    let mediaKey = await getMediaKey(roomId);
    let file = fs.openSync('log_' + roomId + '_' + (+new Date()) + '.json', 'w+');
    fs.writeSync(file, '[{}]');
    let position = 3;
    var w = new WebSocket('wss://prod-chatman-ancillary-eu-central-1.pscp.tv/chatapi/v1/chatnow');
    w.onopen = async () => {
        let access_token = (await accessChatPublic(mediaKey)).access_token
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

watchRoom(process.argv[2])
