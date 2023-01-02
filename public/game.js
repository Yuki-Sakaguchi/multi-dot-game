import Player from './Player.js';

const socket = io();

const IS_RATINA = false
const DEVICE_PIXEL_RATIO = IS_RATINA && window.devicePixelRatio || 1

const canvasEl = document.getElementById('canvas');
const ctx = canvasEl.getContext('2d');
let canvasWidth;
let canvasHeight;

const offsetScreen = document.createElement('canvas');
const offsetCtx = offsetScreen.getContext('2d');

const mapImage = new Image();
mapImage.src = '/map.png';

const TILE_SIZE = 32;
const TILES_IN_ROW = 8;

let players = [];
let groundMap = [[]];
let decalMap = [[]];

const inputs = {
  up: false,
  down: false,
  left: false,
  right: false,
};

function setCanvasSize() {
  canvasEl.width = canvasWidth = window.innerWidth * DEVICE_PIXEL_RATIO
  canvasEl.height = canvasHeight = window.innerHeight * DEVICE_PIXEL_RATIO
  canvasEl.style.width = `${window.innerWidth/DEVICE_PIXEL_RATIO}px`
  canvasEl.style.height = `${window.innerHeight/DEVICE_PIXEL_RATIO}px`

  offsetScreen.width = canvasEl.width;
  offsetScreen.height = canvasEl.height;

  // ドットをくっきり表示させる
  ctx.imageSmoothingEnabled = ctx.msImageSmoothingEnebled = false
  offsetCtx.imageSmoothingEnabled = offsetCtx.msImageSmoothingEnebled = false
  
  // // アスペクト比を維持して最大の表示サイズで表示する
  // if (canvasWidth / VIRTUAL_WIDTH < canvasHeight / VIRTUAL_HEIGHT) {
  //   // 横の方が大きい場合は横に合わせる
  //   canvasHeight = canvasWidth * VIRTUAL_HEIGHT / VIRTUAL_WIDTH
  // } else {
  //   // 縦の方が大きい場合は縦に合わせる
  //   canvasWidth = canvasHeight * VIRTUAL_WIDTH / VIRTUAL_HEIGHT
  // }
}

/**
 * マップを描画する
 */
function renderMap(map, cameraX, cameraY) {
  // マップを描画
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[0].length; col++) {
      const { id } = map[row][col] ?? { id: undefined }; // 存在しなかったら空っぽとして扱う
      const imageRow = parseInt(id / TILES_IN_ROW);
      const imageCol = id % TILES_IN_ROW;
      // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      offsetCtx.drawImage(
        mapImage,
        imageCol * TILE_SIZE,
        imageRow * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
        col * TILE_SIZE - cameraX,
        row * TILE_SIZE - cameraY,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }
}

function init () {
  setCanvasSize();
  main();
}

function main () {
  requestAnimationFrame(main);

  offsetCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const myPlayer = players.find(player => player.id === socket.id);
  let cameraX = 0;
  let cameraY = 0;
  if (myPlayer) {
    cameraX = parseInt(myPlayer.x - canvasEl.width / 2);
    cameraY = parseInt(myPlayer.y - canvasEl.height / 2);
  }

  // マップを描画
  renderMap(groundMap, cameraX, cameraY);

  // オブジェクトを描画
  renderMap(decalMap, cameraX, cameraY);

  // キャラクターの描画
  for (const player of players) {
    player.update(cameraX, cameraY); 
  }

  // オフスクリーンを転写
  ctx.drawImage(offsetScreen, 0, 0);
}

socket.on('connect', () => {
  console.log('connect', socket.id);
});

socket.on('map', (loadedMap) => {
  groundMap = loadedMap.ground;
  decalMap = loadedMap.decal;
});

socket.on('players', (serverPlayers) => {
  for (const serverPlayer of serverPlayers) {
    const targetPlayer = players.find((player) => player.id === serverPlayer.id);
    if (targetPlayer) {
      // 存在する場合はデータを更新
      targetPlayer.x = serverPlayer.x;
      targetPlayer.y = serverPlayer.y;
    } else {
      // 存在しないプレイヤーを追加
      const color = socket.id === serverPlayer.id ? '#ff0000' : '#000000';
      players.push(new Player(offsetCtx, serverPlayer.id, serverPlayer.x, serverPlayer.y, color));
    }
  }
  // 存在しないものは削除
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const isExist = serverPlayers.map(serverPlayer => serverPlayer.id).includes(player.id);
    if (!isExist) {
      players.splice(i, 1);
    }
  }
});

socket.on('enemy', () => {
  // console.log('敵出現');
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'w') {
    inputs['up'] = true;
  } else if (e.key === 's') {
    inputs['down'] = true;
  } else if (e.key === 'a') {
    inputs['left'] = true;
  } else if (e.key === 'd') {
    inputs['right'] = true;
  }
  socket.emit('inputs', inputs);
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'w') {
    inputs['up'] = false;
  } else if (e.key === 's') {
    inputs['down'] = false;
  } else if (e.key === 'a') {
    inputs['left'] = false;
  } else if (e.key === 'd') {
    inputs['right'] = false;
  }
  socket.emit('inputs', inputs);
});

window.addEventListener('resize', () => {
  setCanvasSize();
});

init();

