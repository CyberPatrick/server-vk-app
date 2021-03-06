const WebSocket = require('ws');
const port = process.env.PORT || 5000;
const server = new WebSocket.Server({ port: port });

const mysql = require('mysql2');
const conn = mysql.createConnection({
    database: 'DNC5mb5vKM',
    host: 'remotemysql.com',
    user: 'DNC5mb5vKM',
    password: 'IGYZwPzX2c',
    port: '3306'
}).promise();
// password: process.end.PASSWORD
conn.connect(err => {
    if (err) {
        console.log(`Error: ${err.message}`);
    } else {
        console.log('Connected to database');
    }
});

conn.connect()
    .then(console.log('Connected to database'))
    .catch(err => {
        console.log(`Error: ${err.message}`);
    });

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

console.log('Server created');

let found = false;
const player_1_symbol = Symbol('player_1');


async function checkUser(user_id, first_name, last_name, avatar) {
    const [row, field] = await conn.execute('SELECT games, wins, points FROM `tic-tac-toe` WHERE user_id=?', [user_id]);
    console.log('Inside function');
    if (!row[0]) {
        conn.execute('INSERT INTO `tic-tac-toe` (user_id, first_name, last_name, avatar) VALUES (?, ?, ?, ?)', 
            [user_id, first_name, last_name, avatar]);
        return {games: 0, wins: 0, points: 0};
    }
    return {games: row[0].games, wins: row[0].wins, points: row[0].points};
}


server.on('connection', ws => {
    ws.on('message', message => {
        let message_start = message.slice(0, 3);
        let start = message.indexOf('&');
        let user_id = message.slice(3, start);
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
            let game_id = message.slice(start + 1, end);
            let cell = message.slice(end + 1);
            games[game_id][user_id].send(`GTG${cell}`);
        } else if (message_start === 'GTE') {
            let game_id = message.slice(start + 1);
            games[game_id][user_id].send('GTE');
            delete games[game_id];
            console.log(`Game № ${game_id} was removed`)
        } else if (message_start === 'INF') {
            let center = message.slice(start + 1).indexOf('&') + start + 1;
            let end = message.slice(center + 1).indexOf('&') + center + 1;
            let avatar = message.slice(end + 1);
            let first_name = message.slice(start + 1, center);
            let last_name = message.slice(center + 1, end);
            checkUser(user_id, first_name, last_name, avatar).then(answer => {
                console.log('Sending info...')
                ws.send(`INF${JSON.stringify(answer)}`);
            });
        } 
    });
})