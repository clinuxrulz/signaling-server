import { WebSocketServer } from 'ws';

import { v4 as uuidv4 } from "uuid";

const wss = new WebSocketServer({ port: 8080 });

const peers = [];

wss.on('connection', function(ws) {
    let id = uuidv4();

    ws.on('message', function(message) {
        let data = message.toString();
        let data2;
        try {
            data2 = JSON.parse(data);
        } catch (_ex) {
            return;
        }
        if (data2 == "KeepAlive") {
            // do nothing, message recieved to keep connection open.
        } else if (typeof data2 == "object") {
            if (data2.hasOwnProperty("Signal")) {
                let data3 = data2["Signal"];
                if ((typeof data3 == "object") && data3.hasOwnProperty("receiver") && data3.hasOwnProperty("data")) {
                    let receiver = data3["receiver"];
                    let data = data3["data"];
                    if (typeof receiver == "string") {
                        let signalMessage = JSON.stringify({
                            "Signal": {
                                sender: id,
                                data,
                            }
                        });
                        for (let peer of peers) {
                            if (peer.id == receiver) {
                                peer.ws.send(signalMessage);
                                break;
                            }
                        }
                    }
                }
            }
        }
    });
    ws.on("close", function() {
        for (let i = 0; i < peers.length; ++i) {
            if (peers[i].id == id) {
                peers.splice(i, 1);
                break;
            }
        }
        let peerLeftMessage = JSON.stringify({ "PeerLeft": id });
        for (let peer of peers) {
            peer.ws.send(peerLeftMessage);
        }
    });

    {
        let newPeerMessage = JSON.stringify({ "NewPeer": id, });
        for (let peer of peers) {
            peer.ws.send(newPeerMessage);
        }
    }
    peers.push({
        id,
        ws,
    });
    ws.send(JSON.stringify({ "IdAssigned": id, }));
});
