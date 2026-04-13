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
  chars: ' .,:;-=+*#%@'
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

function buildBookLogo() {
  const pts = [];
  const L = [[-1.78, -0.92, -0.24], [-0.10, -1.06, 0.10], [-0.12, 0.98, 0.14], [-1.58, 1.18, -0.20]];
  const R = [[0.10, -1.06, 0.10], [1.70, -0.90, -0.20], [1.50, 1.04, -0.26], [0.12, 0.98, 0.14]];
  addPolyline(pts, L, 0.02, 1.38, true);
  addPolyline(pts, R, 0.02, 1.38, true);
  addLine(pts, [-0.05, -1.06, 0.10], [0.02, 0.98, 0.15], 0.02, 1.34);
  addLine(pts, [0.05, -1.04, 0.02], [0.10, 0.96, 0.08], 0.022, 1.0);
  for(let i=0;i<10;i++){
    const dz = -0.04 - i * 0.036;
    addLine(pts, [-1.80, 1.16, dz], [0.00, 0.96, 0.08 + dz*0.1], 0.028, 0.84);
    addLine(pts, [0.04, 0.96, 0.08 + dz*0.1], [1.54, 1.02, dz], 0.028, 0.84);
  }
  for(let i=0;i<8;i++){
    const dx = 1.54 + i * 0.045;
    addLine(pts, [dx, 1.00, -0.15 - i*0.02], [dx + 0.022, -0.90, -0.19 - i*0.02], 0.03, 0.9);
  }
  addPageText(pts, -1.58, -0.26, -0.78, 0.80, 0.02, 14);
  addPageText(pts, -0.92, -0.36, -0.08, 0.36, 0.03, 7);
  addPageText(pts, 0.24, 0.98, -0.64, 0.76, 0.04, 12);
  addPageText(pts, 0.22, 0.70, -0.86, -0.50, 0.04, 5);
  for(let i=0;i<8;i++) addDottedBar(pts, -0.94, -0.34, -0.18 + i*0.09, 0.03 + i*0.002, 0.09, 0.92);
  addDiagramCluster(pts, -0.36, -0.68, 0.08, 0.30);
  addPolygonDiagram(pts, 1.04, -0.64, 0.02, 0.30, 10);
  addDiagramCluster(pts, 0.96, -0.02, 0.05, 0.26);
  addDiagramCluster(pts, 0.90, 0.38, 0.06, 0.22);
  addDiagramCluster(pts, 0.84, 0.76, 0.05, 0.19);
  for(let i=0;i<5;i++) addDottedBar(pts, 1.18, 1.38, -0.78 + i*0.32, 0.02, 0.11, 0.8);
  addLine(pts, [1.72, 0.44, -0.18], [2.06, 0.46, -0.08], 0.024, 1.02);
  addLine(pts, [2.06, 0.46, -0.08], [2.10, 0.18, -0.04], 0.028, 1.02);
  addLine(pts, [2.10, 0.18, -0.04], [1.94, 0.06, -0.10], 0.028, 0.96);
  addLine(pts, [1.94, 0.06, -0.10], [1.88, 0.30, -0.14], 0.028, 0.96);
  addLine(pts, [1.88, 0.30, -0.14], [2.06, 0.46, -0.08], 0.028, 0.84);
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
  const scale = Math.min(w, h) * 0.48;
  const cam = 8.7;

  for (const p of state.points) {
    const q = rotate(p, ax, ay, az);
    const depth = 1 / (cam - q.z);
    const px = Math.floor(w * 0.5 + q.x * scale * depth * 3.0);
    const py = Math.floor(h * 0.5 + q.y * scale * depth * 1.86);
    if (px < 0 || px >= w || py < 0 || py >= h) continue;
    const lum = Math.max(0, Math.min(1, ((q.z + 3.0) / 6.5) * p.g));
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
