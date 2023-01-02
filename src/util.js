import path from 'path';
import tmxParser from './tmx-parser-esm.js';

/**
 * マップをロードする処理
 */
export async function loadMap () {
  // console.log(import.meta);
  const __dirname = new URL(import.meta.url).pathname;
  // console.log(__dirname);
  const p = path.join(__dirname, '../map.tmx');
  // console.log(p);
  // const map = await tmxParser.parseFile(p.toString());
  // console.log(map);

  const map = await new Promise((resolve, _) => {
    tmxParser.parseFile(p, (err, loadedMap) => {
      if (err) throw err;
      resolve(loadedMap);
    });
  });

  const groundTiles = map.layers[0].tiles; 
  const decalTiles = map.layers[1].tiles;
  const ground2D = [];
  const decal2D = [];
  for (let row = 0; row < map.height; row++) {
    const groundRow = [];
    const decalRow = [];
    for (let col = 0; col < map.width; col++) {
      const groundTile = groundTiles[row * map.height + col];
      groundRow.push({ id: groundTile.id, gid: groundTile.gid });

      const decalTile = decalTiles[row * map.height + col];
      if (decalTile) {
        decalRow.push({ id: decalTile.id, gid: decalTile.gid });
      } else {
        decalRow.push(undefined);
      }
    }
    ground2D.push(groundRow);
    decal2D.push(decalRow);
  }
  return { ground2D, decal2D };
}

/**
 * 当たり判定
 * @see https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
 */
export function isColliding (rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.h + rect1.y > rect2.y
  );
}
