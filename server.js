const WebSocket = require('ws');
const port = process.env.PORT || 5000;
const server = new WebSocket.Server({ port: port });

let games = {};

// games = {
//     id: {
//         user_id: socket,
//         user_id: socket,
//         play: true
//     }
// }

// Message structure:
// GTGuser_id&game_id&cell

console.log('Server created')

let found = false;
const player_1_symbol = Symbol('player_1');

server.on('connection', ws => {
    ws.on('message', message => {
        let message_start = message.slice(0, 3);
        let separator = message.indexOf('&');
        let user_id = message.slice(3, separator);
        console.log(user_id);
        if (message_start === 'GTF') {
            for (let [id, game] of Object.entries(games)) {
                if (!game.play) {
                    game[user_id] = ws;
                    game.play = true;
                    let player_1 = game[player_1_symbol];
                    game[player_1].send('GTF' + JSON.stringify([id, user_id, 1]));
                    ws.send('GTF' + JSON.stringify([id, player_1[0], 0]));
                    found = true;
                    break;
                }
            }
            if (!found) {
                let id = Math.floor(Math.random() * 1000);
                console.log(`Created game № ${id}`)
                games[id] = { [user_id]: ws, [player_1_symbol]: [user_id], play: false };
            }
            found = false;
        } else if (message_start === 'GTG') {
            let end = message.lastIndexOf('&');
            let game_id = message.slice(separator + 1, end);
            let cell = message.slice(end + 1);
            games[game_id][user_id].send(`GTG${cell}`);
        } else if (message_start === 'GTE') {
            let game_id = message.slice(separator + 1);
            games[game_id][user_id].send('GTE');
            delete games[game_id];
        }
    });
})