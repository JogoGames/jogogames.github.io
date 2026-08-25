
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const ui={score:$('score'),best:$('best'),wave:$('wave'),lives:$('lives'),ammo:$('ammo'),kills:$('kills'),coins:$('coins'),prize:$('prize'),intro:$('intro'),over:$('over'),final:$('final')};
const imgNames=['player-idle.png','player-run.png','player-jump.png','ground.png','brick.png','pipe.png','castle-game-v4.jpg'];
const imgs={}; imgNames.forEach(n=>{const im=new Image();im.src='assets/'+n;imgs[n]=im});
let music=$('music'),jumpS=$('jumpSound'); music.volume=.18;jumpS.volume=.55;
const keys={left:false,right:false,up:false,down:false,fire:false,knife:false};
let sound=true,last=0,state;

function fresh(){
 return {running:false,paused:false,t:0,score:0,best:+localStorage.getItem('ildeZombieBest')||0,wave:1,kills:0,lives:5,ammo:18,
 distance:0,speed:210,spawn:0,zombies:[],bullets:[],blood:[],pickups:[],obstacles:[],nextObstacle:700,
 coins:0,coinChain:0,coinTimer:0,prize:'—',shield:0,coinSpawn:1.2,coinItems:[],
 p:{x:120,y:0,w:62,h:78,vy:0,onGround:false,face:1,knifeCd:0,shootCd:0,inv:0}};
}
state=fresh();
const W=()=>canvas.getBoundingClientRect().width,H=()=>canvas.getBoundingClientRect().height,groundY=()=>H()*.78;
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(r.width*d);canvas.height=Math.floor(r.height*d);ctx.setTransform(d,0,0,d,0,0);state.p.y=Math.min(state.p.y||groundY()-state.p.h,groundY()-state.p.h)}
new ResizeObserver(resize).observe(canvas);

function start(){
 const best=state.best;state=fresh();state.best=best;state.running=true;state.p.y=groundY()-state.p.h;
 ui.intro.classList.add('hidden');ui.over.classList.add('hidden');music.play().catch(()=>{});sync();
}
function end(){
 state.running=false;music.pause();if(state.score>state.best){state.best=Math.floor(state.score);localStorage.setItem('ildeZombieBest',state.best)}
 ui.final.textContent=Math.floor(state.score).toLocaleString('pt-BR');ui.over.classList.remove('hidden');sync();
}
$('startBtn').onclick=start;$('retryBtn').onclick=start;
$('pauseBtn').onclick=()=>{if(state.running){state.paused=!state.paused;$('pauseBtn').textContent=state.paused?'▶ CONTINUAR':'⏸ PAUSAR';if(state.paused)music.pause();else if(sound)music.play().catch(()=>{})}}
$('soundBtn').onclick=e=>{sound=!sound;e.currentTarget.textContent=sound?'🔊 SOM':'🔇 MUDO';if(!sound)music.pause();else if(state.running&&!state.paused)music.play().catch(()=>{})};

const map={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',' ':'up',ArrowDown:'down',s:'down',S:'down',f:'fire',F:'fire',k:'knife',K:'knife'};
addEventListener('keydown',e=>{if(map[e.key]){keys[map[e.key]]=true;e.preventDefault()}if(e.key==='1')selectWeapon('pistol');if(e.key==='2')selectWeapon('rifle');if(e.key==='3')selectWeapon('shotgun');if(e.key==='p'||e.key==='P')$('pauseBtn').click()});
addEventListener('keyup',e=>{if(map[e.key])keys[map[e.key]]=false});
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;const on=e=>{e.preventDefault();keys[k]=true};const off=e=>{e.preventDefault();keys[k]=false};['pointerdown','touchstart'].forEach(v=>b.addEventListener(v,on,{passive:false}));['pointerup','pointercancel','pointerleave','touchend'].forEach(v=>b.addEventListener(v,off,{passive:false}))});
let weapon='pistol';
function selectWeapon(w){
 weapon=w;
 document.querySelectorAll('.weapon').forEach(x=>x.classList.toggle('active',x.dataset.weapon===w));
 const names={pistol:'PISTOLA',rifle:'RIFLE M4',shotgun:'ESCOPETA'};
 const el=document.getElementById('weaponName'); if(el)el.textContent=names[w]||w.toUpperCase();
}
document.querySelectorAll('.weapon').forEach(x=>x.onclick=()=>selectWeapon(x.dataset.weapon));

function hit(a,b){return a.x<a2(b)&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}function a2(b){return b.x+b.w}
function blood(x,y,n=10){for(let i=0;i<n;i++)state.blood.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.7)*160,l:1,r:2+Math.random()*3})}
function shoot(){
 const p=state.p;if(p.shootCd>0||state.ammo<=0)return;p.shootCd=weapon==='rifle'?.11:weapon==='shotgun'?.48:.28;state.ammo--;
 const count=weapon==='shotgun'?5:1;for(let i=0;i<count;i++){state.bullets.push({x:p.x+p.w/2+p.face*26,y:p.y+30,vx:p.face*(weapon==='rifle'?760:680),vy:weapon==='shotgun'?(Math.random()-.5)*180:0,r:weapon==='shotgun'?3:2,damage:weapon==='shotgun'?1:weapon==='rifle'?1:2})}
}
function knife(){
 const p=state.p;if(p.knifeCd>0)return;p.knifeCd=.42;const zone={x:p.face>0?p.x+p.w:p.x-58,y:p.y+12,w:58,h:55};
 state.zombies.forEach(z=>{if(z.hp>0&&hit(zone,z)){z.hp-=3;blood(z.x+z.w/2,z.y+z.h/2,14);if(z.hp<=0)killZombie(z)}})
}
function killZombie(z){if(z.dead)return;z.dead=true;state.kills++;state.score+=120+state.wave*15;blood(z.x+z.w/2,z.y+z.h/2,18)}
function spawnZombie(){
 const boss=state.wave%5===0 && !state.zombies.some(z=>z.boss&&!z.dead);
 const side=Math.random()<.12?-1:1;
 const hp=boss?12:1+Math.floor(state.wave/4);
 state.zombies.push({x:side>0?W()+80:-90,y:groundY()-(boss?92:58),w:boss?74:42,h:boss?92:58,vx:(boss?48:58+state.wave*4)*-side,hp,boss,dead:false,phase:Math.random()*6});
}
function makeObstacle(){
 const t=Math.random();state.obstacles.push({x:W()+150,y:groundY()-(t<.45?56:t<.75?80:44),w:t<.45?52:t<.75?72:48,h:t<.45?56:t<.75?80:44,type:t<.45?'crate':t<.75?'wall':'barrel'});
}


function spawnCoin(){
  const gy=groundY();
  state.coinItems.push({
    x:W()+40+Math.random()*120,
    y:gy-55-Math.random()*120,
    w:22,h:22,
    bob:Math.random()*Math.PI*2
  });
}
function awardPrize(){
  const rewards=[
    {name:'+10 MUNIÇÃO',do:()=>state.ammo+=10},
    {name:'+500 PONTOS',do:()=>state.score+=500},
    {name:'ESCUDO',do:()=>state.shield=6},
    {name:'+1 VIDA',do:()=>state.lives=Math.min(5,state.lives+1)}
  ];
  const r=rewards[Math.floor(Math.random()*rewards.length)];
  r.do(); state.prize=r.name; state.coinChain=0;
}

function update(dt){
 if(!state.running||state.paused)return;state.t+=dt;const p=state.p;p.shootCd=Math.max(0,p.shootCd-dt);p.knifeCd=Math.max(0,p.knifeCd-dt);p.inv=Math.max(0,p.inv-dt);
 let mv=235;if(keys.left){p.x-=mv*dt;p.face=-1}if(keys.right){p.x+=mv*dt;p.face=1}p.x=Math.max(30,Math.min(W()*.55,p.x));
 if(keys.up&&p.onGround){p.vy=-540;p.onGround=false;keys.up=false;if(sound){jumpS.currentTime=0;jumpS.play().catch(()=>{})}}
 p.vy+=1450*dt;p.y+=p.vy*dt;if(p.y+p.h>=groundY()){p.y=groundY()-p.h;p.vy=0;p.onGround=true}
 if(keys.fire)shoot();if(keys.knife)knife();
 state.distance+=state.speed*dt;state.score+=dt*8;
 state.coinSpawn-=dt;if(state.coinSpawn<=0){spawnCoin();state.coinSpawn=.8+Math.random()*1.4}
 state.coinItems.forEach(c=>{c.x-=state.speed*dt;c.bob+=dt*5;if(hit(p,{x:c.x,y:c.y+Math.sin(c.bob)*5,w:c.w,h:c.h})){c.dead=true;state.coins++;state.coinChain++;state.coinTimer=3;state.score+=100;if(state.coinChain>=5)awardPrize();}});
 state.coinTimer=Math.max(0,state.coinTimer-dt);if(state.coinTimer<=0)state.coinChain=0;
 state.coinItems=state.coinItems.filter(c=>!c.dead&&c.x>-40);
 state.spawn-=dt;if(state.spawn<=0){spawnZombie();state.spawn=Math.max(.35,1.5-state.wave*.07)}
 state.nextObstacle-=state.speed*dt;if(state.nextObstacle<0){makeObstacle();state.nextObstacle=500+Math.random()*650}
 state.zombies.forEach(z=>{if(z.dead)return;z.phase+=dt*5;z.x+=z.vx*dt;if(hit(p,z)&&p.inv<=0){if(state.shield>0){state.shield=0;p.inv=.8}else{state.lives--;p.inv=1.1;blood(p.x+p.w/2,p.y+p.h/2,10);if(state.lives<=0)end()}}})
 state.bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;state.zombies.forEach(z=>{if(!z.dead&&b.x>z.x&&b.x<z.x+z.w&&b.y>z.y&&b.y<z.y+z.h){z.hp-=b.damage;b.dead=true;blood(b.x,b.y,8);if(z.hp<=0)killZombie(z)}})})
 state.obstacles.forEach(o=>o.x-=state.speed*dt);
 state.blood.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=420*dt;q.l-=dt*1.7});
 state.bullets=state.bullets.filter(b=>!b.dead&&b.x>-30&&b.x<W()+30);state.zombies=state.zombies.filter(z=>!z.dead&&z.x>-180&&z.x<W()+180);state.obstacles=state.obstacles.filter(o=>o.x>-120);state.blood=state.blood.filter(q=>q.l>0);
 if(state.kills>=state.wave*8){state.wave++;state.ammo=Math.min(40,state.ammo+10)}
 sync();
}
function castle(){
 const w=W(),h=H(),gy=groundY(),scene=imgs['castle-game-v4.jpg'];
 // The actual cinematic artwork is now part of gameplay, not just the cover.
 if(scene && scene.complete && scene.naturalWidth){
   const ir=scene.naturalWidth/scene.naturalHeight, cr=w/h;
   let sx=0,sy=0,sw=scene.naturalWidth,sh=scene.naturalHeight;
   if(ir>cr){sw=scene.naturalHeight*cr;sx=(scene.naturalWidth-sw)/2}
   else {sh=scene.naturalWidth/cr;sy=(scene.naturalHeight-sh)/2}
   ctx.drawImage(scene,sx,sy,sw,sh,0,0,w,h);
   // Darken only enough to preserve readability while keeping the castle/zombies visible.
   const shade=ctx.createLinearGradient(0,0,0,h);
   shade.addColorStop(0,'rgba(1,3,10,.10)');
   shade.addColorStop(.55,'rgba(1,3,10,.18)');
   shade.addColorStop(1,'rgba(1,3,10,.34)');
   ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
 } else {
   let g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#05081d');g.addColorStop(1,'#071410');
   ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 }
 // Neon floor overlay for playable collisions.
 ctx.fillStyle='rgba(3,12,18,.28)';ctx.fillRect(0,gy,w,h-gy);
 ctx.strokeStyle='#19f5ff55';ctx.lineWidth=1;
 for(let x=0;x<w;x+=64)ctx.strokeRect(x,gy,64,38);
}
function drawZombie(z){
 ctx.save();ctx.translate(z.x,z.y);
 ctx.shadowBlur=z.boss?14:4;ctx.shadowColor=z.boss?'#8b111f':'#260a0e';
 const skin=z.boss?'#493036':'#6f6259', cloth=z.boss?'#311219':'#25282b';
 ctx.fillStyle=cloth;ctx.strokeStyle='#170a0d';ctx.lineWidth=2;
 ctx.fillRect(6,22,z.w-12,z.h-23);
 ctx.fillStyle=skin;ctx.beginPath();ctx.arc(z.w/2,16,z.boss?19:14,0,Math.PI*2);ctx.fill();ctx.stroke();
 // torn arms
 ctx.strokeStyle=skin;ctx.lineWidth=z.boss?9:6;
 ctx.beginPath();ctx.moveTo(9,30);ctx.lineTo(-5+Math.sin(z.phase)*5,45);ctx.moveTo(z.w-9,30);ctx.lineTo(z.w+8+Math.cos(z.phase)*5,48);ctx.stroke();
 // legs
 ctx.strokeStyle='#1a2025';ctx.lineWidth=z.boss?11:8;
 ctx.beginPath();ctx.moveTo(z.w*.35,z.h-5);ctx.lineTo(z.w*.26,z.h+10);ctx.moveTo(z.w*.65,z.h-5);ctx.lineTo(z.w*.74,z.h+10);ctx.stroke();
 // eyes and mouth
 ctx.fillStyle='#ff243c';ctx.shadowBlur=8;ctx.shadowColor='#ff243c';
 ctx.beginPath();ctx.arc(z.w*.38,14,2.7,0,7);ctx.arc(z.w*.62,14,2.7,0,7);ctx.fill();
 ctx.shadowBlur=0;ctx.fillStyle='#21090d';ctx.fillRect(z.w*.33,22,z.w*.34,5);
 // blood stains
 ctx.fillStyle='#7d0b17aa';ctx.beginPath();ctx.arc(z.w*.28,30,5,0,7);ctx.arc(z.w*.61,40,4,0,7);ctx.fill();
 if(z.boss){ctx.fillStyle='#ff2b43';ctx.fillRect(0,-12,z.w,5);ctx.fillStyle='#82ff2b';ctx.fillRect(0,-12,z.w*Math.max(0,z.hp/12),5)}
 ctx.restore()
}

function drawHeldWeapon(p){
  const facing=p.face||1;
  const handX=p.x + p.w*0.56;
  const handY=p.y + p.h*0.45;

  ctx.save();
  ctx.translate(handX,handY);
  ctx.scale(facing,1);

  // Knife: metallic blade + dark handle, drawn directly in the game (no photo).
  if(keys.knife && p.knifeCd>.16){
    ctx.rotate(-0.40);
    const blade=ctx.createLinearGradient(12,-10,58,4);
    blade.addColorStop(0,'#d7dce2'); blade.addColorStop(.5,'#ffffff'); blade.addColorStop(1,'#8b949f');
    ctx.fillStyle=blade;
    ctx.beginPath();
    ctx.moveTo(15,-7); ctx.lineTo(58,-2); ctx.lineTo(69,1); ctx.lineTo(58,5); ctx.lineTo(15,8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#717985';ctx.lineWidth=1.2;ctx.stroke();
    ctx.fillStyle='#11151b';ctx.fillRect(-4,-8,22,16);
    ctx.strokeStyle='#414954';ctx.lineWidth=2;
    for(let x=-1;x<14;x+=5){ctx.beginPath();ctx.moveTo(x,-7);ctx.lineTo(x+3,7);ctx.stroke()}
    ctx.fillStyle='#232933';ctx.fillRect(14,-11,5,22);
    ctx.restore(); return;
  }

  // Weapon changes immediately with selection; it is anchored to the hands.
  if(weapon==='rifle'){
    ctx.fillStyle='#171b20';ctx.fillRect(-4,-6,63,12);          // receiver/barrel
    ctx.fillStyle='#2c3239';ctx.fillRect(49,-3,28,6);          // barrel
    ctx.fillStyle='#101419';ctx.beginPath();ctx.moveTo(-4,-5);ctx.lineTo(-22,-12);ctx.lineTo(-22,7);ctx.lineTo(-4,4);ctx.closePath();ctx.fill(); // stock
    ctx.fillStyle='#20262d';ctx.fillRect(10,5,9,22);            // grip
    ctx.fillStyle='#333b44';ctx.beginPath();ctx.moveTo(26,5);ctx.lineTo(39,6);ctx.lineTo(35,24);ctx.lineTo(25,20);ctx.closePath();ctx.fill(); // magazine
    ctx.fillStyle='#39424c';ctx.fillRect(5,-11,22,5);           // rail
  }else if(weapon==='shotgun'){
    ctx.fillStyle='#342317';ctx.fillRect(-7,-5,35,10);          // stock/forearm
    ctx.fillStyle='#15191d';ctx.fillRect(20,-7,58,7);           // upper barrel
    ctx.fillStyle='#252a30';ctx.fillRect(20,1,58,6);            // lower barrel
    ctx.fillStyle='#161a1e';ctx.fillRect(3,5,9,20);             // grip
  }else{
    ctx.fillStyle='#20252b';ctx.fillRect(0,-8,37,14);           // slide
    ctx.fillStyle='#11151a';ctx.fillRect(4,5,12,23);            // grip
    ctx.fillStyle='#3d454f';ctx.fillRect(3,-10,30,3);           // sight line
  }

  if(keys.fire && p.shootCd>.02){
    const mx=weapon==='pistol'?43:80;
    ctx.shadowBlur=22;ctx.shadowColor='#ff9e16';
    ctx.fillStyle='#fff1a5';
    ctx.beginPath();ctx.arc(mx,0,7+Math.random()*4,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function draw(){
 castle();const gy=groundY();
 // obstacles
 state.obstacles.forEach(o=>{ctx.save();ctx.shadowBlur=14;ctx.shadowColor=o.type==='barrel'?'#ff2b43':'#ffc53b';ctx.fillStyle=o.type==='barrel'?'#6d111b':'#6b4218';ctx.strokeStyle=o.type==='barrel'?'#ff2b43':'#ffc53b';ctx.lineWidth=2;ctx.fillRect(o.x,o.y,o.w,o.h);ctx.strokeRect(o.x,o.y,o.w,o.h);ctx.restore()});
 state.zombies.forEach(drawZombie);
 state.bullets.forEach(b=>{ctx.save();ctx.shadowBlur=15;ctx.shadowColor='#ffc53b';ctx.fillStyle='#fff5aa';ctx.fillRect(b.x,b.y,b.r*4,b.r*2);ctx.restore()});
 state.coinItems.forEach(c=>{const cy=c.y+Math.sin(c.bob)*5;ctx.save();ctx.shadowBlur=18;ctx.shadowColor='#ffd43b';ctx.fillStyle='#ffd43b';ctx.strokeStyle='#fff3a3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(c.x+11,cy+11,10,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#8b5b00';ctx.font='900 12px Segoe UI';ctx.textAlign='center';ctx.fillText('★',c.x+11,cy+15);ctx.restore()});
state.blood.forEach(q=>{ctx.save();ctx.globalAlpha=q.l;ctx.fillStyle='#ff1744';ctx.shadowBlur=5;ctx.shadowColor='#ff1744';ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,7);ctx.fill();ctx.restore()});
 const p=state.p,img=!p.onGround?imgs['player-jump.png']:(Math.abs(keys.left? -1:0)+Math.abs(keys.right?1:0)?imgs['player-run.png']:imgs['player-idle.png']);
 if(state.shield>0){ctx.save();ctx.strokeStyle='#19f5ff';ctx.lineWidth=3;ctx.shadowBlur=16;ctx.shadowColor='#19f5ff';ctx.beginPath();ctx.arc(p.x+p.w/2,p.y+p.h/2,48,0,Math.PI*2);ctx.stroke();ctx.restore()}
ctx.save();if(p.inv>0&&Math.floor(state.t*15)%2===0)ctx.globalAlpha=.35;ctx.shadowBlur=18;ctx.shadowColor='#82ff2b';
 if(p.face<0){ctx.translate(p.x+p.w,p.y);ctx.scale(-1,1);ctx.drawImage(img,0,0,p.w,p.h)}else ctx.drawImage(img,p.x,p.y,p.w,p.h);ctx.restore();
 // Weapon attached to the player's hands, changing with the selected arsenal.
 drawHeldWeapon(p);
 ctx.fillStyle='#05070dbb';ctx.fillRect(12,12,210,74);ctx.strokeStyle='#19f5ff77';ctx.strokeRect(12,12,210,74);ctx.fillStyle='#fff';ctx.font='800 13px Segoe UI';ctx.fillText('PROFESSOR ILDEBRANDO',24,33);ctx.fillStyle='#82ff2b';ctx.fillText('ZOMBIE ATTACK',24,52);ctx.fillStyle='#ffc53b';ctx.fillText('ONDA '+state.wave+'   ABATES '+state.kills,24,72);
 if(state.paused){ctx.fillStyle='#000c';ctx.fillRect(0,0,W(),H());ctx.fillStyle='#19f5ff';ctx.font='900 42px Segoe UI';ctx.textAlign='center';ctx.fillText('PAUSADO',W()/2,H()/2);ctx.textAlign='left'}
}
function sync(){
 ui.score.textContent=String(Math.floor(state.score)).padStart(6,'0');ui.best.textContent=String(Math.max(state.best,Math.floor(state.score))).padStart(6,'0');ui.wave.textContent=String(state.wave).padStart(2,'0');ui.lives.textContent='❤'.repeat(state.lives)+'♡'.repeat(Math.max(0,5-state.lives));ui.ammo.textContent=state.ammo;ui.kills.textContent=state.kills;if(ui.coins)ui.coins.textContent=state.coins;if(ui.prize)ui.prize.textContent=state.prize;
}
function loop(t){const dt=Math.min(.032,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}sync();requestAnimationFrame(loop);



function updatePortugalClock(){
  const now=new Date();
  const timeFmt=new Intl.DateTimeFormat('pt-PT',{
    timeZone:'Europe/Lisbon',
    hour:'2-digit',minute:'2-digit',second:'2-digit',
    hour12:false
  });
  const dateFmt=new Intl.DateTimeFormat('pt-PT',{
    timeZone:'Europe/Lisbon',
    weekday:'short',day:'2-digit',month:'2-digit'
  });
  const clock=document.getElementById('portugalClock');
  const date=document.getElementById('portugalDate');
  if(clock) clock.textContent=timeFmt.format(now);
  if(date) date.textContent=dateFmt.format(now).toUpperCase();
}
updatePortugalClock();
setInterval(updatePortugalClock,1000);
