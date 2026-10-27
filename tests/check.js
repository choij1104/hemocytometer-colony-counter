const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1200,height:1000}});
const res=[];const errs=[];
async function fresh(){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+require("path").resolve(__dirname,"../index.html"));await p.evaluate(()=>localStorage.clear());await p.reload();return p;}
async function set(p,o){for(const [id,val] of Object.entries(o)){await p.evaluate(([id,val])=>{const e=document.getElementById(id);e.value=val;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));},[id,String(val)]);}}
async function dishes(p,map){for(const [id,val] of Object.entries(map)){await p.evaluate(([id,val])=>{const e=document.querySelector(`.thumb[data-id="${id}"] input`);e.value=val;e.dispatchEvent(new Event('input'));},[id,val]);}}
const T=async(p,id)=>(await p.textContent('#'+id)).trim();
function check(n,name,got,exp){res.push(`${got===exp?'PASS':'FAIL'} ${n}. ${name}: got "${got}" expected "${exp}"`);}
async function tap(p,k,pts,mk){await p.click(`#overview g[data-k="${k}"]`);await p.click(`[data-mk="${mk}"]`);await p.$eval('#zoom',e=>e.scrollIntoView({block:'center'}));const bb=await (await p.$('#zoom')).boundingBox();
  // viewBox -7..107 => unit = w/114
  for(const [x,y] of pts)await p.mouse.click(bb.x+(x+7)/114*bb.width,bb.y+(y+7)/114*bb.height);}
function grid(n,x0,y0,w,h){const a=[];const c=Math.ceil(Math.sqrt(n));for(let i=0;i<n;i++)a.push([x0+(i%c+.5)*w/c,y0+(Math.floor(i/c)+.5)*h/c]);return a;}
let p;
// 1 cells 4 corners, 30 live 5 dead each, DF 2
p=await fresh();for(const k of ['TL','TR','BL','BR']){await tap(p,k,grid(30,5,5,90,60),'l');await tap(p,k,grid(5,5,75,90,20),'d');}
check(1,'Hemo 4 large sq 120L/20D DF2 live/mL',await T(p,'cOut'),'6.00 × 10⁵');check('1b','viability',await T(p,'cVia'),'85.7 %');check('1c','total/mL',await T(p,'cTot'),'7.00 × 10⁵');
// 2 typed, pre-dilution 1:10, trypan 1:2 => DF 20; 200 live/4 sq
p=await fresh();await set(p,{cMode:'type',cPc:100,cPd:900,cSs:10,cSt:10,cLive:200,cDead:50,cSq:4,cVol:5});
check(2,'Typed DF20 200/4 sq',await T(p,'cOut'),'1.00 × 10⁷');check('2b','DF',await T(p,'cDfK'),'20');check('2c','live in 5 mL',await T(p,'cAll'),'5.00 × 10⁷');check('2d','viability',await T(p,'cVia'),'80.0 %');
// 3 center-5: 7 marks placed in large mode inside an unselected medium (ignored), then 10 live per medium square
p=await fresh();await p.click('[data-mk="l"]');
await tap(p,'C',grid(7,23,3,14,14),'l');
await p.click('[data-rg="medium"]');
for(let i=0;i<5;i++){await p.click(`#medSeg button:nth-child(${i+1})`);await p.$eval('#zoom',e=>e.scrollIntoView({block:'center'}));const bb=await (await p.$('#zoom')).boundingBox();
  for(const [x,y] of grid(10,8,8,84,84))await p.mouse.click(bb.x+(x+7)/114*bb.width,bb.y+(y+7)/114*bb.height);}
check(3,'Center-5 50 cells DF2 (outside marks ignored)',await T(p,'cOut'),'5.00 × 10⁶');check('3b','counted',await T(p,'cN'),'50');
// 3c dense large-square tapping: 49 cells on a 7x7 lattice 12 units apart
p=await fresh();await tap(p,'TL',grid(49,8,8,84,84),'l');check('3c','49 dense taps all kept',await T(p,'zLive'),'49');
// 4 BAM worked example
p=await fresh();await p.click('[data-t="plates"]');await p.click('#pEx');check(4,'BAM example',await T(p,'pOut'),'24,000');
// 5 single dilution spread plate
p=await fresh();await set(p,{pVol:0.1,pUnit:'mL'});await dishes(p,{'2:0':'150','2:1':'170','1:0':'TNTC','1:1':'TNTC','3:0':'14','3:1':'18'});
check(5,'10^-2: 150,170 spread 0.1 mL',await T(p,'pOut'),'1.6 × 10⁵');
// 6 all below 25
p=await fresh();await set(p,{pVol:1});await dishes(p,{'1:0':'12','1:1':'8','2:0':'1','2:1':'0'});check(6,'All <25 at 10^-1',await T(p,'pOut'),'< 250');
// 7 no colonies
p=await fresh();await set(p,{pVol:1});await dishes(p,{'1:0':'0','1:1':'0','2:0':'0','2:1':'0'});check(7,'No colonies',await T(p,'pOut'),'< 10 *');
// 8 all >250 -> EAPC from plate nearest 250
p=await fresh();await set(p,{pVol:1});await dishes(p,{'1:0':'TNTC','1:1':'TNTC','2:0':'300','2:1':'320','3:0':'280','3:1':'290'});check(8,'All >250 EAPC',await T(p,'pOut'),'2.8 × 10⁵ EAPC');
// 9 BAM rounding: 245 at 10^-1 -> 2450 -> 2400 (even); 235 -> 2350 -> 2400 (odd)
p=await fresh();await set(p,{pVol:1,pPer:'1'});await dishes(p,{'1:0':'245'});const r9a=await T(p,'pOut');await dishes(p,{'1:0':'235'});const r9b=await T(p,'pOut');
check(9,'Round 2450 (2nd digit even)',r9a,'2,400');check('9b','Round 2350 (2nd digit odd)',r9b,'2,400');
// 10 non-decimal 1:2 steps, tube 3 = 100 colonies, 0.1 mL -> 100*8/0.1 = 8000
p=await fresh();await set(p,{pTr:100,pDil:100,pVol:0.1,pPer:'1'});await dishes(p,{'3:0':'100'});check(10,'1:2 series tube3 100',await T(p,'pOut'),'8,000');
// extras
p=await fresh();await set(p,{dC1:10,dC2:1,dV2:50});check('11','C1V1 V1',await T(p,'dOut'),'5');
await set(p,{rR:10,rRpm:3000});check('12','RCF r10 3000rpm',await T(p,'rOut'),'1,006 × g');
await set(p,{mType:'molar',mConc:1,mConcU:'1e-3',mVol:100,mVolU:'1e-3',mMw:58.44});check('13','1 mM NaCl 100 mL',await T(p,'mOut'),'5.844 mg');
await set(p,{gN1:100000,gN2:800000,gT:24});check('14','Doubling',await T(p,'gOut'),'8.00 h');
await set(p,{sConc:500000,sPer:10000,sWells:96,sVolW:100,sExtra:0});check('15','Seeding susp',await T(p,'sOut'),'1.92 mL');check('15b','medium',await T(p,'sMed'),'7.68 mL');
await set(p,{oOd:0.8,oTarget:0.1,oFinal:10});check('16','OD dilution culture',await T(p,'oCult'),'1.25 mL');
console.log(res.join('\n'));console.log('pageerrors',errs);await b.close();})();
