"use strict";

var W = 31;
var H = 31;
var GAMECLEAR = 1;
var GAMEOVER = 2;

var maze = [];
var ctx;
var keyCode = 0;
var status = 0;
var timer = NaN;

// ===== Scroller =====
function Scroller() {}

Scroller.prototype.doScroll = function () {
  if (this.dx === 0 && this.dy === 0) return;

  this.scrollCount++;
  if (this.scrollCount >= 5) {
    this.x += this.dx;
    this.y += this.dy;
    this.dx = 0;
    this.dy = 0;
    this.scrollCount = 0;
  }
};

Scroller.prototype.getScrollX = function () {
  return this.x * 50 + this.dx * this.scrollCount * 10;
};

Scroller.prototype.getScrollY = function () {
  return this.y * 50 + this.dy * this.scrollCount * 10;
};

// ===== Player =====
function Player(x, y) {
  this.x = x;
  this.y = y;
  this.dx = 0;
  this.dy = 0;
  this.dir = 0;
  this.scrollCount = 0;
}

Player.prototype = Object.create(Scroller.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function () {
  this.doScroll();
  if (this.scrollCount > 0) return;

  if (this.x === W - 2 && this.y === H - 2) {
    clearInterval(timer);
    status = GAMECLEAR;
    document.getElementById("bgm").pause();
    repaint();
  }

  this.dx = 0;
  this.dy = 0;

  var nx = 0;
  var ny = 0;

  switch (keyCode) {
    case 37: nx = -1; this.dir = 2; break;
    case 38: ny = -1; this.dir = 0; break;
    case 39: nx = 1; this.dir = 3; break;
    case 40: ny = 1; this.dir = 1; break;
  }

  if (maze[this.y + ny][this.x + nx] === 0) {
    this.dx = nx;
    this.dy = ny;
  }
};

Player.prototype.paint = function (gc, x, y, w, h) {
  var img = document.getElementById("hero" + this.dir);
  gc.drawImage(img, x, y, w, h);
};

// ===== Alien =====
function Alien(x, y) {
  this.x = x;
  this.y = y;
  this.dx = 0;
  this.dy = 0;
  this.dir = 0;
  this.scrollCount = 0;
}

Alien.prototype = Object.create(Scroller.prototype);
Alien.prototype.constructor = Alien;

Alien.prototype.update = function () {
  this.doScroll();

  var diffX = Math.abs(player.getScrollX() - this.getScrollX());
  var diffY = Math.abs(player.getScrollY() - this.getScrollY());
  if (diffX <= 40 && diffY <= 40) {
    clearInterval(timer);
    status = GAMEOVER;
    document.getElementById("bgm").pause();
    repaint();
  }

  var gapx = player.x - this.x;
  var gapy = player.y - this.y;

  var r = Math.floor(Math.random() * 4);
  if (r === 0) {
    this.dx = gapx > 0 ? 1 : -1;
    this.dir = this.dx === -1 ? 2 : 3;
  } else if (r === 1) {
    this.dy = gapy > 0 ? 1 : -1;
    this.dir = this.dy === -1 ? 0 : 1;
  } else {
    this.dx = 0;
    this.dy = 0;
  }
};

Alien.prototype.paint = function (gc, w, h) {
  var img = document.getElementById("alien" + this.dir);
  gc.drawImage(img, this.getScrollX(), this.getScrollY(), w, h);
};

// ===== ゲームオブジェクト =====
var player = new Player(1, 1);
var aliens = [
  new Alien(W - 2, 1),
  new Alien(1, W - 2)
];

// ===== 共通処理 =====
function random(v) {
  return Math.floor(Math.random() * v);
}

function init() {
  var mazeCanvas = document.getElementById("maze");
  ctx = mazeCanvas.getContext("2d");
  ctx.font = "bold 48px sans-serif";
  createMaze(W, H);
  repaint();
}

function go() {
  window.onkeydown = mykeydown;
  window.onkeyup = mykeyup;

  var mazeCanvas = document.getElementById("maze");
  mazeCanvas.onmousedown = mymousedown;
  mazeCanvas.onmouseup = mykeyup;
  mazeCanvas.ontouchstart = mymousedown;
  mazeCanvas.ontouchend = mykeyup;
  mazeCanvas.oncontextmenu = function (e) { e.preventDefault(); };

  timer = setInterval(tick, 45);
  document.getElementById("START").style.display = "none";
  document.getElementById("bgm").play();
}

function tick() {
  player.update();

  for (var i = 0; i < aliens.length; i++) {
    aliens[i].update();
  }

  repaint();
}

function createMaze(w, h) {
  for (var y = 0; y < h; y++) {
    maze[y] = [];
    for (var x = 0; x < w; x++) {
      maze[y][x] = (x === 0 || x === w - 1 || y === 0 || y === h - 1) ? 1 : 0;
    }
  }

  for (var yy = 2; yy < h - 2; yy += 2) {
    for (var xx = 2; xx < w - 2; xx += 2) {
      maze[yy][xx] = 1;
      var dir = random(yy === 2 ? 4 : 3);
      var px = xx;
      var py = yy;

      if (dir === 0) py++;
      if (dir === 1) px--;
      if (dir === 2) px++;
      if (dir === 3) py--;

      maze[py][px] = 1;
    }
  }
}

function repaint() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 900, 600);

  ctx.save();
  ctx.beginPath();
  ctx.arc(300, 300, 300, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "brown";
  ctx.translate(6 * 50, 6 * 50);
  ctx.translate(-player.getScrollX(), -player.getScrollY());

  for (var x = 0; x < W; x++) {
    for (var y = 0; y < H; y++) {
      if (maze[y][x] === 1) {
        ctx.fillRect(x * 50, y * 50, 50, 50);
      }
    }
  }

  for (var i = 0; i < aliens.length; i++) {
    aliens[i].paint(ctx, 50, 50);
  }

  ctx.restore();

  var arrows = document.getElementById("arrows");
  ctx.drawImage(arrows, 670, 70, 200, 200);

  player.paint(ctx, 300, 300, 50, 50);

  ctx.fillStyle = "yellow";
  if (status === GAMEOVER) ctx.fillText("GAME OVER", 150, 200);
  if (status === GAMECLEAR) ctx.fillText("GAME CLEAR", 150, 200);
}

function mykeydown(e) { keyCode = e.keyCode; }
function mykeyup(e) { keyCode = 0; }

function mymousedown(e) {
  var mouseX = e.offsetX || (e.touches && e.touches[0].clientX);
  var mouseY = e.offsetY || (e.touches && e.touches[0].clientY);

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
