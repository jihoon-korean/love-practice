'use strict';
const $=id=>document.getElementById(id);
const defaultState=()=>({name:'',hp:100,mood:60,money:100000,day:1,slot:0,minutes:860,stage:0,relation:0,logs:[],items:[],visited:[],flags:{},scene:'town'});
let st=defaultState();
try{const raw=localStorage.getItem('love-practice-map-v1');if(raw)st={...st,...JSON.parse(raw)};else{const old=localStorage.getItem('love-practice-08');if(old){const v=JSON.parse(old);st={...st,hp:v.hp??100,mood:v.mood??60,money:v.money??100000,day:v.day??1,slot:v.slot??0,minutes:v.minutes??860,stage:v.stage??0,relation:v.relation??0,logs:v.logs??[],items:v.items??[]}}}}catch(e){console.warn(e)}
const TIME_SLOTS=['아침','점심','오후 1','오후 2','저녁','밤'];
// Previous saves used a minute-based clock; start the new six-slot system at morning without resetting progress.
if(!Number.isInteger(st.slot)||st.slot<0||st.slot>5)st.slot=0;
if(!Number.isInteger(st.day)||st.day<1)st.day=1;
const locations=[{id:'house',label:'🏠 주인공 집',x:13,y:73,desc:'휴식과 하루 마무리'},{id:'flower',label:'💐 꽃집',x:20,y:42,desc:'꽃 선물 구매'},{id:'starbucks',label:'☕ 카페',x:39,y:43,desc:'한서윤과의 만남'},{id:'gukbap',label:'🍲 국밥집',x:54,y:41,desc:'식사로 체력 회복'},{id:'park',label:'🌳 공원',x:61,y:24,desc:'산책과 휴식'},{id:'pet',label:'🐶 애견샵',x:82,y:30,desc:'강아지와의 만남'},{id:'cu',label:'🏪 CU 편의점',x:74,y:48,desc:'생활용품 구매'},{id:'bus',label:'🚌 버스정류장',x:59,y:70,desc:'다른 지역으로 이동'}];
const stories=[
{say:'어서 오세요! 처음 뵙는 분 같은데… 이사 오신 거예요?',options:[['네, 최근에 이사 왔어요.',2,'아, 그러셨구나! 앞으로 자주 뵙겠네요.'],['좋은 카페네요. 자주 올 것 같아요.',1,'감사해요. 편하게 들러 주세요!'],['커피 한 잔 주세요. (4,500원)',0,'네, 아메리카노 준비해 드릴게요.',4500]]},
{say:'어? 저번에 오셨던 분이네요. 오늘은 어떠셨어요?',options:[['바빴지만 괜찮았어요.',2,'고생 많으셨어요. 커피 한잔하며 쉬세요.'],['여기 커피가 생각났어요.',1,'후후, 그러셨구나. 오늘도 같은 메뉴로 드릴까요?'],['그냥 쉬고 싶어요.',0,'네, 편하게 쉬다 가세요.']]},
{say:'혹시 근처에 산책하기 좋은 곳 아세요?',options:[['언제 같이 가 보실래요?',2,'아, 오늘은 일이 있어서요. 다음에 기회가 된다면요.'],['공원 쪽이 예쁘더라고요.',1,'저도 한번 가봐야겠네요!'],['아직 동네를 잘 몰라요.',0,'저도 여기 온 지 얼마 안 됐어요.']]}];
function persist(){try{localStorage.setItem('love-practice-map-v1',JSON.stringify(st))}catch(e){console.warn(e)}}
function save(){persist();alert('게임이 저장되었습니다.')}
function update(){
 $('player').textContent='Lv.1 '+(st.name||'이름 미설정');$('hp').textContent=st.hp;$('mood').textContent=st.mood;$('love').textContent=st.relation;
 $('money').textContent='🪙 '+st.money.toLocaleString()+'원';
 $('clock').textContent='📅 '+st.day+'일차　☀️ '+TIME_SLOTS[st.slot]+'　('+ (st.slot+1)+'/6)';
 $('quest').textContent=st.stage===0?'□ 카페에서 한서윤과 첫 인사':st.stage<3?'☑ 한서윤과 첫 인사　□ 다시 카페 방문':'☑ 첫 번째 이야기 완료';persist();
}
function advance(slots=1){
 const n=Math.max(0,Math.floor(Number(slots)||0));if(!n)return;
 const total=st.slot+n;st.day+=Math.floor(total/6);st.slot=total%6;
 update();
}
function show(title,body){$('wrap').classList.remove('cafe-mode');$('panel').innerHTML='<button class="close" onclick="closePanel()">✕ 닫기</button><h2>'+title+'</h2>'+body;$('wrap').classList.add('show')}
function closePanel(){$('wrap').classList.remove('show','cafe-mode')}
function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b}
function showChoices(title,description,options){show(title,'<p>'+description+'</p><div class="options" id="options"></div>');const root=$('options');for(const [label,cb] of options)root.append(button(label,cb))}
function home(){closePanel();renderSpots()}
function renderSpots(){const el=$('spots');el.replaceChildren();for(const l of locations){const b=document.createElement('button');b.className='spot';b.textContent=l.label;b.style.left=l.x+'%';b.style.top=l.y+'%';b.onclick=()=>visit(l.id);el.append(b)}}
function nameStart(){show('🏠 새로운 동네에서의 시작','<p>게임에서 사용할 주인공 이름을 정해주세요. <strong>최대 4글자</strong>입니다.</p><input id="newName" maxlength="4" placeholder="이름 입력" autocomplete="off"><p><button id="nameGo">게임 시작하기</button></p>');$('nameGo').onclick=()=>{const v=Array.from($('newName').value.trim());if(!v.length||v.length>4){alert('이름은 1~4글자로 입력해 주세요.');return}st.name=v.join('');update();closePanel()}}
const SEOYOON_PORTRAIT='assets/characters/seoyoon/normal.png';
function seoyoonFace(){return '<div class="face character-face"><img src="'+SEOYOON_PORTRAIT+'" alt="카페 바리스타 한서윤" loading="eager" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="face-fallback" style="display:none">👩🏻</span></div>'}
function seoyoonReply(message,options){show('☕ 카페 · 한서윤','<div class="event">'+seoyoonFace()+'<div class="story"><div class="sub">한서윤 · 바리스타</div><p>'+message+'</p><div class="options" id="options"></div></div></div>');$('wrap').classList.add('cafe-mode');for(const [label,callback] of options)$('options').append(button(label,callback))}
const CAFE_MENU=[
 {name:'아메리카노',price:3000},
 {name:'바닐라라떼',price:4500},
 {name:'아이스티',price:4000},
 {name:'녹차라떼',price:5000},
 {name:'자몽에이드',price:4800}
];
function cafeMenuOptions(){return [
 ...CAFE_MENU.map(item=>[item.name+' ('+item.price.toLocaleString()+'원)',()=>cafeOrder(item.name,item.price)]),
 ['동네로 돌아가기',closePanel]
]}
function storyAtCafe(){
 st.flags=st.flags||{};
 st.flags.cafeVisits=(Number(st.flags.cafeVisits)||0)+1;
 const count=st.flags.cafeVisits;
 if(count<20){seoyoonReply('안녕하세요. 어떤 걸로 드릴까요?',cafeMenuOptions());return}
 seoyoonReply('어? 오늘도 오셨네요. 이제 얼굴이 익숙해졌어요.',[
  ...CAFE_MENU.map(item=>[item.name+' ('+item.price.toLocaleString()+'원)',()=>cafeOrder(item.name,item.price)]),
  ['제 이름을 기억하세요?',()=>{st.relation+=1;st.logs.push('한서윤과 조금 더 친해졌다.');advance(1);seoyoonReply('그럼요. 자주 오시는 손님이시잖아요.',[['동네로 돌아가기',closePanel]])}],
  ['동네로 돌아가기',closePanel]
 ]);
}
function cafeOrder(item,price){
 if(st.money<price){seoyoonReply('죄송하지만 결제 금액이 부족한 것 같아요.',[['동네로 돌아가기',closePanel]]);return}
 st.money-=price;st.items.push(item);st.mood=Math.min(100,st.mood+3);st.logs.push('카페 '+item+' 주문');advance(1);
 seoyoonReply('네, '+item+' 준비해 드릴게요.',[['동네로 돌아가기',closePanel]]);
}
function purchase(item,price,hp=0,mood=0){if(st.money<price){alert('돈이 부족합니다.');return}st.money-=price;st.hp=Math.min(100,st.hp+hp);st.mood=Math.min(100,st.mood+mood);st.items.push(item);st.logs.push(item+' 구매');advance(1);showChoices('구매 완료',item+'을(를) 구매했습니다.',[['동네로 돌아가기',closePanel]])}
function visit(id){const l=locations.find(v=>v.id===id);if(!l)return;st.visited=[...new Set([...st.visited,id])];persist();if(id==='starbucks')return storyAtCafe();if(id==='house')return showChoices('🏠 '+st.name+'의 집','오늘도 수고했어요. 잠시 쉬어갈까요?',[['휴식하기 (체력 +20, 1때)',()=>{st.hp=Math.min(100,st.hp+20);advance(1);showChoices('휴식 완료','몸이 한결 가벼워졌습니다.',[['돌아가기',closePanel]])}],['잠자기 · 다음 날',()=>{st.day++;st.slot=0;st.hp=100;st.mood=Math.min(100,st.mood+10);update();showChoices('새로운 아침','새로운 하루가 시작되었습니다.',[['동네로 돌아가기',closePanel]])}]]);if(id==='flower')return showChoices('💐 꽃집','화사한 꽃향기가 가득합니다.',[['꽃다발 구매 (12,000원)',()=>purchase('꽃다발',12000)],['동네로 돌아가기',closePanel]]);if(id==='cu')return showChoices('🏪 CU 편의점','오늘도 다양한 상품이 진열되어 있습니다.',[['생수 구매 (1,000원)',()=>purchase('생수',1000,3)],['간식 구매 (2,500원)',()=>purchase('간식',2500,0,4)],['동네로 돌아가기',closePanel]]);if(id==='gukbap')return showChoices('🍲 국밥집','진한 국물 냄새가 가게 안을 채웁니다.',[['국밥 먹기 (9,000원)',()=>purchase('국밥',9000,25,5)],['동네로 돌아가기',closePanel]]);if(id==='park')return showChoices('🌳 동네 공원','벚꽃잎이 바람에 흩날립니다.',[['산책하기 (기분 +10, 1때)',()=>{st.mood=Math.min(100,st.mood+10);advance(1);showChoices('산책 완료','기분 좋은 바람을 맞으며 산책했습니다.',[['돌아가기',closePanel]])}],['동네로 돌아가기',closePanel]]);if(id==='pet')return showChoices('🐶 애견샵','귀여운 강아지들이 반갑게 맞이합니다.',[['강아지 구경하기 (기분 +5)',()=>{st.mood=Math.min(100,st.mood+5);advance(1);showChoices('애견샵','강아지가 꼬리를 흔듭니다. 언젠가 반려동물을 키워볼까요?',[['돌아가기',closePanel]])}],['동네로 돌아가기',closePanel]]);if(id==='bus')return showChoices('🚌 버스정류장','회사와 다른 지역으로 이동하는 버스가 정차하는 곳입니다.',[['출근 노선 확인',()=>showChoices('🚌 버스 노선','회사 출근 노선은 다음 업데이트에서 개통됩니다.',[['돌아가기',closePanel]])],['동네로 돌아가기',closePanel]])}
function schedule(){show('📅 일정','<p>오늘의 목표: '+(st.stage<3?'한서윤과의 관계를 발전시키기':'동네에서 자유롭게 생활하기')+'</p><p>버스정류장 회사 노선은 준비 중입니다.</p>')}
function people(){show('💗 인물 관계','<p>한서윤 · 카페 바리스타</p><p>호감도: '+st.relation+'</p><p>대화 진행: '+st.stage+'/3</p>')}
function inventory(){show('👜 가방','<p>소지금: '+st.money.toLocaleString()+'원</p><p>소지품: '+(st.items.join(', ')||'없음')+'</p>')}
function journal(){show('📒 기록',st.logs.length?st.logs.map((v,i)=>'<p>'+(i+1)+'. '+v.replace(/</g,'&lt;')+'</p>').join(''):'<p>아직 기록이 없습니다.</p>')}
function settings(){show('⚙️ 설정','<p>이름: '+(st.name||'미설정')+'</p><p>자동 저장: 켜짐</p><p><button onclick="save()">저장</button><button onclick="reset()">새 게임</button></p>')}
function reset(){if(confirm('기존 진행 기록을 초기화하고 새 게임을 시작할까요?')){st=defaultState();update();nameStart()}}
$('wrap').addEventListener('click',e=>{if(e.target===$('wrap'))closePanel()});addEventListener('pagehide',persist);
const probe=new Image();probe.onload=()=>{$('scene').classList.remove('fallback');$('scene').classList.add('loaded')};probe.onerror=()=>{$('mapStatus').textContent='⚠️ town-map.png 이미지를 불러오지 못했습니다. GitHub assets 폴더에서 파일을 확인해 주세요.'};probe.src='assets/maps/town-map.png?map=20261110b';renderSpots();update();if(!st.name)nameStart();
