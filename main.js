"use strict";

const W = 31;
const H = 31;
const GAMECLEAR = 1;
const GAMEOVER = 2;

const maze = [];
let ctx;
let keyCode = 0;
let status = 0;
let timer = NaN;

// ===== Scroller =====
function Scroller() {
  this.doScroll = function () {
    if (this.dx == 0 && this.dy == 0) return;

    if (++this.scrollCount >= 5) {
      this.x += this.dx;
      this.y += this.dy;
      this.dx = 0;
      this.dy = 0;
      this.scrollCount = 0;
    }
  };

  this.getScrollX = function () {
    return this.x * 50 + this.dx * this.scrollCount * 10;
  };

  this.getScrollY = function () {
    return this.y * 50 + this.dy * this.scrollCount * 10;
  };
}

// ===== Player =====
function Player(x, y) {
  this.x = x;
  this.y = y;
  this.dx = 0;
  this.dy = 0;
  this.dir = 0;
  this.scrollCount = 0;

  this.update = function () {
    this.doScroll();
    if (this.scrollCount > 0) return;

    if (this.x == W - 2 && this.y == H - 2) {
      clearInterval(timer);
      status = GAMECLEAR;
      document.getElementById("bgm").pause();
      repaint();
    }

    this.dx = this.dy = 0;
    let nx = 0, ny = 0;

    switch (keyCode) {
      case 37: nx = -1; this.dir = 2; break;
      case 38: ny = -1; this.dir = 0; break;
      case 39: nx = 1; this.dir = 3; break;
      case 40: ny = 1; this.dir = 1; break;
    }

    if (maze[this.y + ny][this.x + nx] == 0) {
      this.dx = nx;
      this.dy = ny;
    }
  };

  this.paint = function (gc, x, y, w, h) {
    let img = document.getElementById("hero" + this.dir);
    gc.drawImage(img, x, y, w, h);
  };
}

// ===== Alien =====
function Alien(x, y) {
  this.x = x;
  this.y = y;
  this.dx = 0;
  this.dy = 0;
  this.dir = 0;
  this.scrollCount = 0;

  this.update = function () {
    this.doScroll();

    let diffX = Math.abs(player.getScrollX() - this.getScrollX());
    let diffY = Math.abs(player.getScrollY() - this.getScrollY());
    if (diffX <= 40 && diffY <= 40) {
      clearInterval(timer);
      status = GAMEOVER;
      document.getElementById("bgm").pause();
      repaint();
    }

    let gapx = player.x - this.x;
    let gapy = player.y - this.y;

    switch (Math.floor(Math.random() * 4)) {
      case 0:
        this.dx = gapx > 0 ? 1 : -1;
        this.dir = this.dx == -1 ? 2 : 3;
        break;
      case 1:
        this.dy = gapy > 0 ? 1 : -1;
        this.dir = this.dy == -1 ? 0 : 1;
        break;
      default:
        this.dx = this.dy = 0;
    }
  };

  this.paint = function (gc, w, h) {
    let img = document.getElementById("alien" + this.dir);
    gc.drawImage(img, this.getScrollX(), this.getScrollY(), w, h);
  };
}

// ===== prototype 設定（ここ重要・最後にやる）=====
let scroller = new Scroller();
Player.prototype = scroller;
Alien.prototype = scroller;

// ===== ゲームオブジェクト生成 =====
const player = new Player(1, 1);
const aliens = [new Alien(W - 2, 1), new Alien(1, W - 2)];

// ===== 以下ゲーム処理 =====
function random(v) {
  return Math.floor(Math.random() * v);
}

function init() {
  let mazeCanvas = document.getElementById("maze");
  ctx = mazeCanvas.getContext("2d");
  ctx.font = "bold 48px sans-serif";
  createMaze(W, H);
  repaint();
}

function go() {
  window.onkeydown = mykeydown;
  window.onkeyup = mykeyup;

  let mazeCanvas = document.getElementById("maze");
  mazeCanvas.onmousedown = mymousedown;
  mazeCanvas.onmouseup = mykeyup;
  mazeCanvas.oncontextmenu = e => e.preventDefault();
  mazeCanvas.addEventListener("touchstart", mymousedown);
  mazeCanvas.addEventListener("touchend", mykeyup);

  timer = setInterval(tick, 45);
  document.getElementById("START").style.display = "none";
  document.getElementById("bgm").play();
}

function tick() {
  player.update();
  aliens.forEach(a => a.update());
  repaint();
}

function createMaze(w, h) {
  for (let y = 0; y < h; y++) {
    maze[y] = [];
    for (let x = 0; x < w; x++) {
      maze[y][x] =
        x == 0 || x == w - 1 || y == 0 || y == h - 1 ? 1 : 0;
    }
  }

  for (let y = 2; y < h - 2; y += 2) {
    for (let x = 2; x < w - 2; x += 2) {
      maze[y][x] = 1;
      let dir = random(y == 2 ? 4 : 3);
      let px = x, py = y;
      if (dir == 0) py++;
      if (dir == 1) px--;
      if (dir == 2) px++;
      if (dir == 3) py--;
      maze[py][px] = 1;
    }
  }
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function repaint() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 900, 600);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "brown";
  ctx.translate(6 * 50, 6 * 50);
  ctx.translate(-player.getScrollX(), -player.getScrollY());

  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      if (maze[y][x] == 1) {
        ctx.fillRect(x * 50, y * 50, 50, 50);
      }
    }
  }

  aliens.forEach(a => a.paint(ctx, 50, 50));
  ctx.restore();

  let arrows = document.getElementById("arrows");
  ctx.drawImage(arrows, 670, 70, 200, 200);

  player.paint(ctx, 300, 300, 50, 50);

  ctx.fillStyle = "yellow";
  if (status == GAMEOVER) ctx.fillText("GAME OVER", 150, 200);
  if (status == GAMECLEAR) ctx.fillText("GAME CLEAR", 150, 200);
}

function mykeydown(e) { keyCode = e.keyCode; }
function mykeyup(e) { keyCode = 0; }

function mymousedown(e) {
  let mouseX = !isNaN(e.offsetX) ? e.offsetX : e.touches[0].clientX;
  let mouseY = !isNaN(e.offsetY) ? e.offsetY : e.touches[0].clientY;

  if (670 < mouseX && mouseX < 870 && 70 < mouseY && mouseY < 270) {
    mouseX -= 770;
    mouseY -= 170;
    if (Math.abs(mouseX) > Math.abs(mouseY)) {
      keyCode = mouseX < 0 ? 37 : 39;
    } else {
      keyCode = mouseY < 0 ? 38 : 40;
    }
  }
}
