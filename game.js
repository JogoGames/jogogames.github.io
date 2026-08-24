const c=document.getElementById("game"),x=c.getContext("2d");
let S,K={up:0,down:0,left:0,right:0,fire:0,missile:0},last=0,fireCd=0,missileCd=0;
const $=id=>document.getElementById(id);


// ===== ÁUDIO POR ARQUIVOS WAV =====
let soundEnabled = true;
const audio = {
  shoot: $("sndShoot"),
  missile: $("sndMissile"),
  explosion: $("sndExplosion"),
  hit: $("sndHit"),
  start: $("sndStart"),
  gameover: $("sndGameOver"),
  music: $("sndMusic")
};
audio.music.volume = 0.24;
audio.shoot.volume = 0.55;
audio.missile.volume = 0.65;
audio.explosion.volume = 0.72;
audio.hit.volume = 0.65;
audio.start.volume = 0.7;
audio.gameover.volume = 0.7;

function playSound(name){
  if(!soundEnabled || !audio[name]) return;
  try{
    const a=audio[name];
    a.currentTime=0;
    const p=a.play();
    if(p && p.catch) p.catch(()=>{});
  }catch(e){}
}
function startMusic(){
  if(!soundEnabled) return;
  try{
    audio.music.currentTime=0;
    const p=audio.music.play();
    if(p && p.catch) p.catch(()=>{});
  }catch(e){}
}
function stopMusic(){ try{audio.music.pause();}catch(e){} }

function unlockAudio(){
  Object.values(audio).forEach(a=>{
    try{
      a.muted=false;
      a.load();
    }catch(e){}
  });
}

const soundToggle = $("soundToggle");
if(soundToggle){
  soundToggle.onclick=()=>{
    unlockAudio();
    soundEnabled=!soundEnabled;
    soundToggle.textContent=soundEnabled?"🔊 SOM":"🔇 MUDO";
    soundToggle.classList.toggle("muted",!soundEnabled);
    if(soundEnabled && S.run) startMusic(); else stopMusic();
  };
}

function reset(){let best=+(localStorage.ilCombatBest||0);S={run:1,pause:0,score:0,best,wave:1,lives:3,armor:100,missiles:5,t:0,spawn:0,player:{x:0,y:0,r:18},bullets:[],rockets:[],enemies:[],shots:[],parts:[]};}
reset();S.run=0;
function resize(){let r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=r.width*d;c.height=r.height*d;x.setTransform(d,0,0,d,0,0);if(!S.player.x){S.player.x=r.width/2;S.player.y=r.height*.76}}
new ResizeObserver(resize).observe(c); const W=()=>c.getBoundingClientRect().width,H=()=>c.getBoundingClientRect().height;
function start(){unlockAudio();playSound("start");let b=S.best;reset();S.best=b;S.player.x=W()/2;S.player.y=H()*.78;$("intro").classList.add("hide");$("over").classList.add("hide");sync();startMusic()}
$("start").onclick=start;$("play").onclick=start;$("again").onclick=start;$("pause").onclick=()=>{if(S.run)S.pause=!S.pause};
let map={ArrowUp:"up",w:"up",W:"up",ArrowDown:"down",s:"down",S:"down",ArrowLeft:"left",a:"left",A:"left",ArrowRight:"right",d:"right",D:"right"," ":"fire",Shift:"missile"};
addEventListener("keydown",e=>{if(map[e.key]){K[map[e.key]]=1;e.preventDefault()}if(e.key==="p"||e.key==="P")S.pause=!S.pause});
addEventListener("keyup",e=>{if(map[e.key])K[map[e.key]]=0});
document.querySelectorAll("[data-k]").forEach(b=>{let k=b.dataset.k,on=e=>{e.preventDefault();K[k]=1},off=e=>{e.preventDefault();K[k]=0};["pointerdown","touchstart"].forEach(v=>b.addEventListener(v,on,{passive:false}));["pointerup","pointercancel","pointerleave","touchend"].forEach(v=>b.addEventListener(v,off,{passive:false}))});
function particle(px,py,col,n=10){for(let i=0;i<n;i++)S.parts.push({x:px,y:py,vx:(Math.random()-.5)*180,vy:(Math.random()-.5)*180,l:1,c:col})}
function enemy(){let type=Math.random()<.22?"heavy":"drone";S.enemies.push({x:30+Math.random()*(W()-60),y:-30,vx:(Math.random()-.5)*90,vy:(85+Math.random()*55)+S.wave*8,r:type==="heavy"?25:17,hp:type==="heavy"?4:1,type,cd:1+Math.random()*2})}
function shoot(){playSound("shoot");S.bullets.push({x:S.player.x-9,y:S.player.y-22,vy:-620},{x:S.player.x+9,y:S.player.y-22,vy:-620});particle(S.player.x,S.player.y-25,"#20f6ff",2)}
function rocket(){if(S.missiles<=0)return;playSound("missile");S.missiles--;S.rockets.push({x:S.player.x,y:S.player.y-30,vy:-390,r:7});}
function hit(a,b,rr=0){let dx=a.x-b.x,dy=a.y-b.y,r=(a.r||3)+(b.r||3)+rr;return dx*dx+dy*dy<r*r}
function update(dt){if(!S.run||S.pause)return;S.t+=dt;S.wave=1+Math.floor(S.score/3500);let sp=260;if(K.up)S.player.y-=sp*dt;if(K.down)S.player.y+=sp*dt;if(K.left)S.player.x-=sp*dt;if(K.right)S.player.x+=sp*dt;S.player.x=Math.max(24,Math.min(W()-24,S.player.x));S.player.y=Math.max(55,Math.min(H()-100,S.player.y));
fireCd-=dt;if(K.fire&&fireCd<=0){shoot();fireCd=.13}missileCd-=dt;if(K.missile&&missileCd<=0){rocket();missileCd=.7}
S.spawn-=dt;if(S.spawn<=0){enemy();S.spawn=Math.max(.28,.9-S.wave*.055)}
S.enemies.forEach(e=>{e.x+=e.vx*dt;e.y+=e.vy*dt;e.cd-=dt;if(e.x<20||e.x>W()-20)e.vx*=-1;if(e.cd<0&&e.y>40&&e.y<H()*.7){S.shots.push({x:e.x,y:e.y+10,vy:220+S.wave*8,r:4});e.cd=1.3+Math.random()*1.5}});
S.bullets.forEach(b=>b.y+=b.vy*dt);S.rockets.forEach(r=>r.y+=r.vy*dt);S.shots.forEach(q=>q.y+=q.vy*dt);
for(let i=S.bullets.length-1;i>=0;i--){let b=S.bullets[i];for(let j=S.enemies.length-1;j>=0;j--){let e=S.enemies[j];if(hit(b,e)){S.bullets.splice(i,1);e.hp--;particle(b.x,b.y,"#20f6ff",5);if(e.hp<=0){particle(e.x,e.y,"#ff2bd6",18);playSound("explosion");S.score+=e.type==="heavy"?450:150;S.enemies.splice(j,1)}break}}}
for(let i=S.rockets.length-1;i>=0;i--){let r=S.rockets[i],boom=false;for(let j=S.enemies.length-1;j>=0;j--)if(hit(r,S.enemies[j],10)){boom=true;break}if(boom){particle(r.x,r.y,"#ffbd37",30);playSound("explosion");S.enemies=S.enemies.filter(e=>{if(Math.hypot(e.x-r.x,e.y-r.y)<100){S.score+=200;return false}return true});S.rockets.splice(i,1)}}
for(let i=S.shots.length-1;i>=0;i--){if(hit(S.shots[i],S.player)){particle(S.player.x,S.player.y,"#ff2bd6",16);playSound("hit");S.shots.splice(i,1);S.armor-=22;if(S.armor<=0){S.lives--;S.armor=100;if(S.lives<=0)return over()}}}
for(let i=S.enemies.length-1;i>=0;i--){let e=S.enemies[i];if(hit(e,S.player)){particle(e.x,e.y,"#ff2bd6",20);S.enemies.splice(i,1);S.armor-=35}else if(e.y>H()+40)S.enemies.splice(i,1)}
S.bullets=S.bullets.filter(b=>b.y>-30);S.rockets=S.rockets.filter(r=>r.y>-40);S.shots=S.shots.filter(q=>q.y<H()+20);S.parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt*2});S.parts=S.parts.filter(p=>p.l>0);S.score+=10*dt;sync()}
function over(){S.run=0;stopMusic();playSound("gameover");if(S.score>S.best){S.best=Math.floor(S.score);localStorage.ilCombatBest=S.best}$("final").textContent=Math.floor(S.score).toLocaleString("pt-BR");$("over").classList.remove("hide");sync()}
function jet(px,py){x.save();x.translate(px,py);x.shadowBlur=24;x.shadowColor="#20f6ff";x.strokeStyle="#20f6ff";x.fillStyle="#08243b";x.lineWidth=2;x.beginPath();x.moveTo(0,-30);x.lineTo(10,-5);x.lineTo(31,9);x.lineTo(11,12);x.lineTo(8,29);x.lineTo(0,20);x.lineTo(-8,29);x.lineTo(-11,12);x.lineTo(-31,9);x.lineTo(-10,-5);x.closePath();x.fill();x.stroke();x.fillStyle="#fff";x.beginPath();x.ellipse(0,-8,5,10,0,0,7);x.fill();x.restore()}
function draw(){let w=W(),h=H();x.clearRect(0,0,w,h);let g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,"#06182e");g.addColorStop(1,"#01040b");x.fillStyle=g;x.fillRect(0,0,w,h);x.strokeStyle="#20f6ff12";for(let i=0;i<w;i+=50){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke()}for(let i=(S.t*80)%50;i<h;i+=50){x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke()}
S.bullets.forEach(b=>{x.shadowBlur=15;x.shadowColor="#20f6ff";x.fillStyle="#dfffff";x.fillRect(b.x-2,b.y-12,4,18)});S.rockets.forEach(r=>{x.shadowBlur=20;x.shadowColor="#ffbd37";x.fillStyle="#ffbd37";x.fillRect(r.x-4,r.y-10,8,18);x.fillStyle="#ff5522";x.fillRect(r.x-2,r.y+8,4,12)});
S.enemies.forEach(e=>{x.save();x.translate(e.x,e.y);x.shadowBlur=20;x.shadowColor="#ff2bd6";x.strokeStyle="#ff2bd6";x.fillStyle=e.type==="heavy"?"#36112f":"#240c2c";x.lineWidth=2;x.beginPath();x.moveTo(0,18);x.lineTo(-e.r,-12);x.lineTo(-8,-7);x.lineTo(0,-20);x.lineTo(8,-7);x.lineTo(e.r,-12);x.closePath();x.fill();x.stroke();x.restore()});
S.shots.forEach(q=>{x.shadowBlur=14;x.shadowColor="#ff334f";x.fillStyle="#ff334f";x.beginPath();x.arc(q.x,q.y,q.r,0,7);x.fill()});S.parts.forEach(p=>{x.globalAlpha=p.l;x.fillStyle=p.c;x.fillRect(p.x,p.y,3,3);x.globalAlpha=1});jet(S.player.x,S.player.y);
if(S.pause){x.fillStyle="#000a";x.fillRect(0,0,w,h);x.fillStyle="#20f6ff";x.font="bold 42px Segoe UI";x.textAlign="center";x.fillText("PAUSADO",w/2,h/2)}}
function sync(){$("score").textContent=String(Math.floor(S.score)).padStart(6,"0");$("best").textContent=String(Math.max(S.best,Math.floor(S.score))).padStart(6,"0");$("wave").textContent=String(S.wave).padStart(2,"0");$("lives").textContent="♥".repeat(S.lives)+"♡".repeat(3-S.lives);$("armorTxt").textContent=Math.max(0,S.armor)+"%";$("armor").style.width=Math.max(0,S.armor)+"%";$("missiles").textContent=S.missiles;$("missileBar").style.width=(S.missiles/5*100)+"%";let t=Math.min(100,S.wave*12);$("threatBar").style.width=t+"%";$("threat").textContent=t<35?"BAIXA":t<70?"MÉDIA":"ALTA"}
function loop(t){let dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}sync();requestAnimationFrame(loop);