const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#gameOverlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startButton = document.querySelector("#startButton");
const soundButton = document.querySelector("#soundButton");
const ASSET = "feed_the_dragon_assets/";

const dragonImage = loadImage(`${ASSET}dragon_right.png`);
const coinImage = loadImage(`${ASSET}coin.png`);
const sounds = {
  coin: new Audio(`${ASSET}coin_sound.wav`),
  miss: new Audio(`${ASSET}miss_sound.wav`),
  music: new Audio(`${ASSET}ftd_background_music.wav`),
};
sounds.music.loop = true;
sounds.music.volume = .4;
sounds.miss.volume = .16;

const keys = new Set();
let width = 1000;
let height = 400;
let scale = 1;
let running = false;
let soundEnabled = true;
let lastTime = 0;
let score = 0;
let lives = 5;
let coinSpeed = 600;
let dragging = false;

const dragon = { x: 32, y: 168, size: 64 };
const coin = { x: 1100, y: 140, size: 32 };

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  width = rect.width;
  height = rect.height;
  scale = Math.max(.58, Math.min(width / 1000, height / 400));
  dragon.size = clamp(64 * scale, 48, 82);
  coin.size = clamp(32 * scale, 26, 42);
  dragon.x = clamp(32 * scale, 16, 42);
  dragon.y = clamp(dragon.y, hudHeight(), height - dragon.size);
  coin.x = clamp(coin.x, -coin.size, width + 100 * scale);
  coin.y = clamp(coin.y, hudHeight(), height - coin.size);
}

function hudHeight() {
  return clamp(64 * scale, 58, 82);
}

function play(name) {
  if (!soundEnabled) return;
  const sound = sounds[name];
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function resetCoin(keepSpeed = false) {
  coin.x = width + Math.max(70, 100 * scale);
  coin.y = hudHeight() + Math.random() * Math.max(1, height - hudHeight() - coin.size);
  if (!keepSpeed) coinSpeed = 600 * Math.max(.72, scale);
}

function resetGame() {
  score = 0;
  lives = 5;
  dragon.y = height / 2 - dragon.size / 2;
  resetCoin();
}

function startGame() {
  resetGame();
  overlay.classList.remove("is-visible");
  startButton.textContent = "Tekrar oyna";
  running = true;
  lastTime = performance.now();
  if (soundEnabled) sounds.music.play().catch(() => {});
  requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  sounds.music.pause();
  overlayTitle.textContent = `Skor: ${score}`;
  overlayText.textContent = "Ejderhanın altın avı burada bitti. Daha hızlı bir seri için yeniden başlayabilirsin.";
  overlay.classList.add("is-visible");
}

function update(dt) {
  const up = keys.has("ArrowUp") || keys.has("KeyW");
  const down = keys.has("ArrowDown") || keys.has("KeyS");
  const move = 600 * scale * dt;
  if (up) dragon.y -= move;
  if (down) dragon.y += move;
  dragon.y = clamp(dragon.y, hudHeight(), height - dragon.size);

  coin.x -= coinSpeed * dt;
  if (intersects(dragon, coin)) {
    score += 1;
    coinSpeed += 30 * Math.max(.72, scale);
    play("coin");
    resetCoin(true);
  } else if (coin.x + coin.size < 0) {
    lives -= 1;
    play("miss");
    resetCoin(true);
    if (lives <= 0) gameOver();
  }
}

function intersects(a, b) {
  const pad = 5 * scale;
  return (
    a.x + pad < b.x + b.size &&
    a.x + a.size - pad > b.x &&
    a.y + pad < b.y + b.size &&
    a.y + a.size - pad > b.y
  );
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#010703";
  ctx.fillRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, hudHeight(), width, height);
  gradient.addColorStop(0, "rgba(10, 61, 24, .48)");
  gradient.addColorStop(1, "rgba(1, 16, 7, .08)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, hudHeight(), width, height - hudHeight());

  ctx.strokeStyle = "rgba(255,255,255,.68)";
  ctx.lineWidth = Math.max(1, 2 * scale);
  ctx.beginPath();
  ctx.moveTo(0, hudHeight());
  ctx.lineTo(width, hudHeight());
  ctx.stroke();

  const font = clamp(29 * scale, 16, 33);
  ctx.font = `400 ${font}px Dragon, Impact, sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#5dff78";
  ctx.fillText(`Skor: ${score}`, 10, 10);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e9ffec";
  ctx.fillText("Feed the Dragon", width / 2, 10);
  ctx.textAlign = "right";
  ctx.fillStyle = "#5dff78";
  ctx.fillText(`Can: ${lives}`, width - 10, 10);
  ctx.textAlign = "left";

  const coinGlow = ctx.createRadialGradient(
    coin.x + coin.size / 2,
    coin.y + coin.size / 2,
    0,
    coin.x + coin.size / 2,
    coin.y + coin.size / 2,
    coin.size * 2.2,
  );
  coinGlow.addColorStop(0, "rgba(255,225,75,.34)");
  coinGlow.addColorStop(1, "rgba(255,225,75,0)");
  ctx.fillStyle = coinGlow;
  ctx.fillRect(coin.x - coin.size * 2, coin.y - coin.size * 2, coin.size * 5, coin.size * 5);

  if (dragonImage.complete) ctx.drawImage(dragonImage, dragon.x, dragon.y, dragon.size, dragon.size);
  if (coinImage.complete) ctx.drawImage(coinImage, coin.x, coin.y, coin.size, coin.size);
}

function loop(now) {
  if (!running) return;
  const dt = Math.min((now - lastTime) / 1000, .034);
  lastTime = now;
  update(dt);
  draw();
  if (running) requestAnimationFrame(loop);
}

function setKey(code, active, button) {
  if (active) keys.add(code);
  else keys.delete(code);
  button?.classList.toggle("is-active", active);
}

function moveDragonToPointer(event) {
  const rect = canvas.getBoundingClientRect();
  dragon.y = clamp(event.clientY - rect.top - dragon.size / 2, hudHeight(), height - dragon.size);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown"].includes(event.code)) event.preventDefault();
  keys.add(event.code);
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());
window.addEventListener("resize", resize);

canvas.addEventListener("pointerdown", (event) => {
  if (!running) return;
  dragging = true;
  canvas.setPointerCapture?.(event.pointerId);
  moveDragonToPointer(event);
});
canvas.addEventListener("pointermove", (event) => {
  if (dragging) moveDragonToPointer(event);
});
canvas.addEventListener("pointerup", () => { dragging = false; });
canvas.addEventListener("pointercancel", () => { dragging = false; });

document.querySelectorAll("[data-key]").forEach((button) => {
  const code = button.dataset.key;
  const press = (event) => {
    event.preventDefault();
    setKey(code, true, button);
    button.setPointerCapture?.(event.pointerId);
  };
  const release = (event) => {
    event.preventDefault();
    setKey(code, false, button);
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

startButton.addEventListener("click", startGame);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "Ses açık" : "Ses kapalı";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
  Object.values(sounds).forEach((sound) => { sound.muted = !soundEnabled; });
  if (soundEnabled && running) sounds.music.play().catch(() => {});
  else sounds.music.pause();
});

resize();
resetGame();
draw();
