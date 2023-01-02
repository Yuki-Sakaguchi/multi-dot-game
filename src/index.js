import express from "express";
import { createServer } from 'http';
import { Server } from 'socket.io';

import { loadMap } from "./util.js";

const PORT = process.env.PORT || 5000;
const FPS = 1000 / 30;

const app = express();
const httpServer = createServer(app);

app.use(express.static('public'));
httpServer.listen(PORT);

const io = new Server(httpServer);

// ゲームに関する変数
const SPEED = 5;
const STAGE_WIDTH = 3200;
const STAGE_HEIGHT = 3200;
const PLAYER_SIZE = 50;
const inputMap = {};

let players = [];
let ground2D;
let decal2D;
let frame = 0;


/**
 * フレームごとの処理
 */
const tick = (_) => {
  frame++;

  // プレイヤーの移動
  for (const player of players) {
    const inputs = inputMap[player.id];
    // const previousX = player.x;
    // const previousY = player.y;
    if (inputs.up) {
      player.y -= SPEED;
    } else if (inputs.down) {
      player.y += SPEED;
    }
    if (inputs.left) {
      player.x -= SPEED;
    } else if (inputs.right) {
      player.x += SPEED;
    }
  }
  
  if (frame % 60 === 0) {
    io.emit('enemy');
  }

  // 経過フレームの初期化
  if (frame > 10000000) {
    frame = 0;
  }

  io.emit('players', players);
};

/**
 * メイン処理
 */
const main = async () => {
  const map = await loadMap();
  ground2D = map.ground2D;
  decal2D = map.decal2D;

  io.on('connect', (socket) => {
    console.log('socket', socket.id);

    players.push({
      id: socket.id,
      x: STAGE_WIDTH / 2 - PLAYER_SIZE / 2, 
      y: STAGE_HEIGHT / 2 - PLAYER_SIZE / 2,
    });

    inputMap[socket.id] = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    socket.emit('map', {
      ground: ground2D,
      decal: decal2D,
    });

    socket.on('disconnect', () => {
      console.log('desconnect', socket.id);
      players = players.filter((player) => player.id !== socket.id);
    });

    socket.on('inputs', (inputs) => {
      inputMap[socket.id] = inputs;
    });
  });

  let lastUpdate = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdate;
    tick(delta);
    lastUpdate = now;
  }, FPS);
};

main();

