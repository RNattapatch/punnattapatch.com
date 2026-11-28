// Coordinates for original pose guides, in a normalized portrait viewfinder.
const guides = {
  seat: [[154,68],[146,108],[111,119],[172,117],[95,183],[182,169],[135,210],[159,210],[124,199],[170,210],[104,225],[197,227],[93,335],[200,335],[115,343],[222,342]],
  pocket: [[149,60],[148,100],[119,106],[176,107],[109,162],[190,156],[133,198],[176,189],[132,206],[168,207],[128,273],[165,272],[110,343],[161,342],[130,350],[184,349]],
  walk: [[147,63],[146,102],[116,107],[173,108],[104,165],[193,161],[87,207],[175,209],[127,203],[168,209],[109,270],[177,264],[110,340],[194,320],[135,345],[218,330]],
  lean: [[176,63],[168,104],[140,113],[198,112],[120,161],[204,165],[142,195],[180,198],[148,207],[181,206],[143,278],[170,275],[122,346],[138,336],[143,352],[159,341]],
  turn: [[162,65],[165,105],[145,113],[179,118],[135,167],[191,171],[124,205],[190,215],[152,208],[175,214],[134,278],[175,281],[132,343],[181,348],[111,350],[160,354]],
  cup: [[147,65],[150,103],[122,108],[179,109],[110,165],[191,168],[148,146],[155,155],[130,203],[167,205],[135,276],[163,275],[121,348],[164,347],[142,354],[185,354]],
  rail: [[156,71],[156,110],[123,114],[181,117],[104,158],[200,171],[67,167],[215,168],[132,207],[168,206],[128,276],[173,273],[124,347],[182,346],[146,352],[204,352]],
};

const limbs = [[2,4,6],[3,5,7],[2,1,3,9,8,2],[8,10,12,14],[9,11,13,15]];
export function paintGuide(canvas, style, live = false, mirror = false) {
  const ctx = canvas.getContext('2d');
  const points = guides[style];
  if (!ctx || !points) return;
  ctx.clearRect(0, 0, 300, 400);
  ctx.save();
  if (mirror) { ctx.translate(300, 0); ctx.scale(-1, 1); }
  const [x,y] = points[0];
  if (!live) {
    ctx.strokeStyle = '#785ba433';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6,7]);
    ctx.strokeRect(43, 35, 214, 327);
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = live ? '#e8ffa0' : '#513976';
  ctx.fillStyle = live ? '#e8ffa02e' : '#6e509c23';
  if (live) { ctx.shadowColor = '#1e1534'; ctx.shadowBlur = 5; }
  ctx.lineWidth = live ? 3.5 : 4.5;
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(x,y,19,25,0,0,2*Math.PI);
  ctx.fill(); ctx.stroke();
  for (const line of limbs) {
    ctx.beginPath();
    line.forEach((index, i) => {
      const [px,py] = points[index];
      if (i === 0) ctx.moveTo(px,py);
      else ctx.lineTo(px,py);
    });
    if (line.length === 6) ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
