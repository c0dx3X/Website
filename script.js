const el = document.getElementById('ascii-logo');
const hitbox = document.getElementById('logo-hitbox');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  width: 0,
  height: 0,
  points: [],
  rotX: -0.58,
  rotY: 0.82,
  rotZ: -0.06,
  autoX: 0.0012,
  autoY: 0.0036,
  autoZ: 0.0007,
  dragX: 0,
  dragY: 0,
  dragging: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
  chars: ' .`:^",;Il!i~+_-?][}{1)(|\\/*tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
};

function addPoint(pts, x, y, z, g=1.0){ pts.push({x,y,z,g}); }
function addLine(pts, a, b, step=0.028, weight=1.0){
  for(let t=0;t<=1.0001;t+=step){
    addPoint(pts, a[0] + (b[0]-a[0]) * t, a[1] + (b[1]-a[1]) * t, a[2] + (b[2]-a[2]) * t, weight);
  }
}
function addPolyline(pts, arr, step=0.028, weight=1.0, close=false){
  for(let i=0;i<arr.length-1;i++) addLine(pts, arr[i], arr[i+1], step, weight);
  if(close && arr.length > 2) addLine(pts, arr[arr.length-1], arr[0], step, weight);
}
function addPageText(pts, x1, x2, yStart, yEnd, zBase, lines) {
  const stepY = (yEnd - yStart) / lines;
  for(let i=0;i<lines;i++){
    const y = yStart + i * stepY;
    for(let t=0.03;t<0.97;t+=0.03){
      const x = x1 + (x2 - x1) * t;
      const yy = y + 0.018 * Math.sin((t * 18) + i * 0.8);
      const z = zBase + 0.012 * Math.sin(t * 11 + i * 0.6);
      addPoint(pts, x, yy, z, 0.72);
    }
  }
}
function addDottedBar(pts, x1, x2, y, z, step=0.055, weight=0.9){
  for(let t=0;t<=1.001;t+=step){
    const x = x1 + (x2 - x1) * t;
    addPoint(pts, x, y, z, weight);
  }
}
function addDiagramCluster(pts, cx, cy, cz, s=0.22) {
  const poly = [
    [cx - s*0.8, cy + s*0.1, cz],
    [cx - s*0.1, cy - s*0.9, cz + s*0.25],
    [cx + s*0.95, cy - s*0.15, cz - s*0.05],
    [cx + s*0.3, cy + s*0.95, cz + s*0.18]
  ];
  addPolyline(pts, poly, 0.026, 1.12, true);
  addLine(pts, poly[0], poly[2], 0.03, 0.98);
  addLine(pts, poly[1], poly[3], 0.03, 0.98);
}
function addPolygonDiagram(pts, cx, cy, cz, r=0.28, n=10){
  const ring = [];
  for(let i=0;i<n;i++){
    const a = (Math.PI*2*i/n) + 0.12;
    ring.push([cx + Math.cos(a)*r, cy + Math.sin(a)*r, cz + 0.03*Math.sin(a)]);
  }
  addPolyline(pts, ring, 0.024, 1.08, true);
  for(let i=0;i<ring.length;i+=2){
    addLine(pts, [cx, cy, cz+0.01], ring[i], 0.028, 0.9);
  }
}
function addCircuitStream(pts, start, end, z, amp=0.08, phase=0, weight=0.84){
  const steps = 26;
  for(let i=0;i<=steps;i++){
    const t = i / steps;
    const x = start[0] + (end[0] - start[0]) * t;
    const y = start[1] + (end[1] - start[1]) * t + Math.sin((t * Math.PI * 4) + phase) * amp;
    addPoint(pts, x, y, z + Math.cos((t * Math.PI * 3) + phase) * 0.02, weight);
  }
}
function addHub(pts, cx, cy, cz, r=0.09){
  const ring = [];
  for(let i=0;i<8;i++){
    const a = Math.PI * 2 * i / 8;
    ring.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]);
  }
  addPolyline(pts, ring, 0.022, 1.16, true);
  addLine(pts, [cx - r * 1.3, cy, cz], [cx + r * 1.3, cy, cz], 0.02, 0.9);
  addLine(pts, [cx, cy - r * 1.3, cz], [cx, cy + r * 1.3, cz], 0.02, 0.9);
}
function addPageGrid(pts, x1, x2, y1, y2, z, cols=5, rows=5, weight=0.58){
  for(let c=1;c<cols;c++){
    const x = x1 + ((x2 - x1) * c / cols);
    addLine(pts, [x, y1, z], [x, y2, z], 0.03, weight);
  }
  for(let r=1;r<rows;r++){
    const y = y1 + ((y2 - y1) * r / rows);
    addLine(pts, [x1, y, z], [x2, y, z], 0.03, weight);
  }
}
function addSpineRibs(pts, x, y1, y2, z1, count=9, spread=0.05){
  for(let i=0;i<count;i++){
    const t = i / Math.max(1, count - 1);
    const y = y1 + (y2 - y1) * t;
    addLine(pts, [x - spread, y, z1 - 0.02], [x + spread, y, z1 + 0.02], 0.02, 0.88);
  }
}
function addMarginNotes(pts, x, y1, y2, z, count=7){
  for(let i=0;i<count;i++){
    const y = y1 + ((y2 - y1) * i / Math.max(1, count - 1));
    addDottedBar(pts, x - 0.12, x + 0.12, y, z, 0.05, 0.74);
  }
}

function buildBookLogo() {
  const pts = [];
  const L = [[-1.98, -1.08, -0.28], [-0.10, -1.24, 0.14], [-0.12, 1.16, 0.18], [-1.78, 1.38, -0.24]];
  const R = [[0.10, -1.24, 0.14], [1.90, -1.04, -0.24], [1.70, 1.18, -0.30], [0.12, 1.16, 0.18]];
  addPolyline(pts, L, 0.02, 1.38, true);
  addPolyline(pts, R, 0.02, 1.38, true);
  addLine(pts, [-0.06, -1.24, 0.12], [0.02, 1.16, 0.18], 0.018, 1.42);
  addLine(pts, [0.06, -1.20, 0.03], [0.10, 1.12, 0.10], 0.02, 1.06);
  for(let i=0;i<13;i++){
    const dz = -0.04 - i * 0.038;
    addLine(pts, [-2.00, 1.36, dz], [0.00, 1.12, 0.10 + dz*0.1], 0.026, 0.84);
    addLine(pts, [0.04, 1.12, 0.10 + dz*0.1], [1.74, 1.16, dz], 0.026, 0.84);
  }
  for(let i=0;i<10;i++){
    const dx = 1.70 + i * 0.05;
    addLine(pts, [dx, 1.12, -0.18 - i*0.02], [dx + 0.024, -1.02, -0.22 - i*0.02], 0.028, 0.9);
  }
  addPageText(pts, -1.74, -0.28, -0.94, 0.96, 0.03, 18);
  addPageText(pts, -1.02, -0.34, -0.12, 0.44, 0.05, 8);
  addPageGrid(pts, -1.48, -0.50, -0.86, 0.72, 0.04, 4, 6, 0.54);
  addMarginNotes(pts, -0.52, -0.76, 0.68, 0.06, 8);
  addPageText(pts, 0.26, 1.16, -0.82, 0.90, 0.05, 16);
  addPageText(pts, 0.22, 0.74, -1.02, -0.56, 0.05, 6);
  addPageGrid(pts, 0.40, 1.20, -0.74, 0.70, 0.05, 5, 6, 0.52);
  for(let i=0;i<9;i++) addDottedBar(pts, -1.04, -0.30, -0.24 + i*0.11, 0.04 + i*0.002, 0.08, 0.94);
  addDiagramCluster(pts, -0.40, -0.82, 0.10, 0.34);
  addPolygonDiagram(pts, 1.18, -0.74, 0.02, 0.34, 10);
  addDiagramCluster(pts, 1.08, -0.06, 0.06, 0.30);
  addDiagramCluster(pts, 1.00, 0.42, 0.06, 0.24);
  addDiagramCluster(pts, 0.92, 0.88, 0.05, 0.20);
  addCircuitStream(pts, [0.24, 0.96], [1.48, 0.92], 0.06, 0.036, 0.2, 0.78);
  addCircuitStream(pts, [0.22, 0.52], [1.52, 0.44], 0.05, 0.046, 1.1, 0.80);
  addCircuitStream(pts, [0.20, 0.08], [1.46, -0.10], 0.04, 0.038, 2.0, 0.78);
  addCircuitStream(pts, [0.22, -0.38], [1.40, -0.58], 0.03, 0.032, 0.6, 0.74);
  addHub(pts, 1.62, 0.92, 0.04, 0.09);
  addHub(pts, 1.64, 0.46, 0.03, 0.09);
  addHub(pts, 1.56, -0.06, 0.03, 0.085);
  addHub(pts, 1.48, -0.58, 0.02, 0.08);
  addSpineRibs(pts, 0.02, -1.10, 1.06, 0.16, 11, 0.08);
  for(let i=0;i<6;i++) addDottedBar(pts, 1.30, 1.56, -0.90 + i*0.38, 0.03, 0.11, 0.82);
  addLine(pts, [1.92, 0.54, -0.20], [2.30, 0.56, -0.08], 0.022, 1.04);
  addLine(pts, [2.30, 0.56, -0.08], [2.34, 0.24, -0.04], 0.026, 1.04);
  addLine(pts, [2.34, 0.24, -0.04], [2.16, 0.10, -0.11], 0.026, 0.98);
  addLine(pts, [2.16, 0.10, -0.11], [2.10, 0.38, -0.15], 0.026, 0.98);
  addLine(pts, [2.10, 0.38, -0.15], [2.30, 0.56, -0.08], 0.026, 0.86);
  state.points = pts;
}

function rotate(p, ax, ay, az) {
  let {x, y, z} = p;
  const sx = Math.sin(ax), cx = Math.cos(ax);
  const sy = Math.sin(ay), cy = Math.cos(ay);
  const sz = Math.sin(az), cz = Math.cos(az);
  let y1 = y * cx - z * sx;
  let z1 = y * sx + z * cx;
  y = y1; z = z1;
  let x1 = x * cy + z * sy;
  let z2 = -x * sy + z * cy;
  x = x1; z = z2;
  let x2 = x * cz - y * sz;
  let y2 = x * sz + y * cz;
  return {x:x2, y:y2, z};
}

function resize() {
  const rect = hitbox.parentElement.getBoundingClientRect();
  state.width = Math.max(84, Math.floor(rect.width / 8.0));
  state.height = Math.max(34, Math.floor(rect.height / 10.6));
  draw();
}

function draw() {
  const w = state.width, h = state.height;
  if (!w || !h) return;
  const buf = Array.from({length:h}, () => Array(w).fill(' '));
  const zbuf = Array.from({length:h}, () => Array(w).fill(-Infinity));
  const ax = state.rotX + state.dragY;
  const ay = state.rotY + state.dragX;
  const az = state.rotZ;
  const scale = Math.min(w, h) * 0.52;
  const cam = 8.7;

  for (const p of state.points) {
    const q = rotate(p, ax, ay, az);
    const depth = 1 / (cam - q.z);
    const px = Math.floor(w * 0.5 + q.x * scale * depth * 3.0);
    const py = Math.floor(h * 0.5 + q.y * scale * depth * 1.86);
    if (px < 0 || px >= w || py < 0 || py >= h) continue;
    const lum = Math.max(0, Math.min(1, (0.32 + ((q.z + 3.0) / 6.5) * 0.68) * p.g));
    const idx = Math.min(state.chars.length - 1, Math.floor(lum * (state.chars.length - 1)));
    if (depth > zbuf[py][px]) {
      zbuf[py][px] = depth;
      buf[py][px] = state.chars[idx];
    }
  }
  el.textContent = buf.map(r => r.join('')).join('\n');
}

function animate() {
  if (!reduced) {
    state.rotX += state.autoX;
    state.rotY += state.autoY;
    state.rotZ += state.autoZ;
  }
  draw();
  requestAnimationFrame(animate);
}

function clamp(v, min, max){ return Math.min(max, Math.max(min, v)); }

function onPointerDown(e){
  state.dragging = true;
  state.pointerId = e.pointerId;
  state.lastX = e.clientX;
  state.lastY = e.clientY;
  hitbox.setPointerCapture(e.pointerId);
}

function onPointerMove(e){
  if (!state.dragging || e.pointerId !== state.pointerId) return;
  const dx = e.clientX - state.lastX;
  const dy = e.clientY - state.lastY;
  state.lastX = e.clientX;
  state.lastY = e.clientY;
  state.dragX += dx * 0.004;
  state.dragY += dy * 0.0032;
  state.dragY = clamp(state.dragY, -0.9, 0.9);
}

function onPointerUp(e){
  if (e.pointerId !== state.pointerId) return;
  state.dragging = false;
  state.pointerId = null;
}

buildBookLogo();
resize();
hitbox.addEventListener('pointerdown', onPointerDown);
hitbox.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp, { passive:true });
window.addEventListener('resize', resize, { passive:true });
requestAnimationFrame(animate);
