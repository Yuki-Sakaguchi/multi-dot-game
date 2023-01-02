const playerImage = new Image();
playerImage.src = '/hero-sheet.png';

const TILE_SIZE = 16;
const VIEW_SIZE = TILE_SIZE * 3;

export default class Player {
  constructor(ctx, id, x, y, color = '#ff0000', size = TILE_SIZE) {
    this.ctx = ctx;
    this.id = id;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.frame = 0;
    this.delta = 0;
  }

  update(cameraX, cameraY) {
    // this.ctx.fillStyle = this.color;
    // this.ctx.fillRect(this.x - cameraX, this.y - cameraY, this.size, this.size);
    const frame = this.frame % 2;
    this.ctx.drawImage(
      playerImage,
      frame * this.size,
      0,
      this.size,
      this.size,
      this.x - VIEW_SIZE / 2 - cameraX,
      this.y - VIEW_SIZE / 2 - cameraY,
      VIEW_SIZE,
      VIEW_SIZE
    );
    this.frame++;
  }
}
