'use strict';
const $=id=>document.getElementById(id);
const defaultState=()=>({name:'',hp:100,mood:60,money:100000,day:1,slot:0,mapId:'town',minutes:860,stage:0,relation:0,logs:[],items:[],visited:[],flags:{},scene:'town'});
let st=defaultState();
try{const raw=localStorage.getItem('love-practice-map-v1');if(raw)st={...st,...JSON.parse(raw)};else{const old=localStorage.getItem('love-practice-08');if(old){const v=JSON.parse(old);st={...st,hp:v.hp??100,mood:v.mood??60,money:v.money??100000,day:v.day??1,slot:v.slot??0,minutes:v.minutes??860,stage:v.stage??0,relation:v.relation??0,logs:v.logs??[],items:v.items??[]}}}}catch(e){console.warn(e)}
const TIME_SLOTS=['아침','점심','낮','저녁','밤','새벽'];
const HOME_MAP_ID='town',BUS_FARE=1800,TAXI_FARE_DAY=8000,TAXI_FARE_NIGHT=20000;
const OPEN_HOURS={house:[0,1,2,3,4,5],flower:[0,1,2,3],starbucks:[0,1,2,3],gukbap:[0,1,2,3,4,5],park:[0,1,2,3,4,5],pet:[0,1,2,3],cu:[0,1,2,3,4,5],bus:[0,1,2,3],taxi:[0,1,2,3,4,5]};
function isOpen(id,slot=st.slot){return (OPEN_HOURS[id]||[]).includes(slot)}
function debtLocked(){return st.money<0}
function blockedByDebt(){if(!debtLocked())return false;showChoices('💸 생활비 부족','현재 빚이 '+Math.abs(st.money).toLocaleString()+'원 있습니다. 빚을 갚기 전에는 소비와 연애 활동을 할 수 없습니다. 회사에서 근무하거나 집에서 휴식하세요.',[['확인',closePanel]]);return true}
function taxiFare(slot=st.slot){return slot>=4?TAXI_FARE_NIGHT:TAXI_FARE_DAY}
function travelByTaxi(destination){return travel(destination,'taxi')}
function busOperating(slot=st.slot){return slot>=0&&slot<4}
function isNight(slot=st.slot){return slot>=4}
// Previous saves used a minute-based clock; start the new six-slot system at morning without resetting progress.
if(!Number.isInteger(st.slot)||st.slot<0||st.slot>5)st.slot=0;
if(!Number.isInteger(st.day)||st.day<1)st.day=1;
if(!['town','office'].includes(st.mapId))st.mapId=st.mapId==='hospital'?'office':HOME_MAP_ID;
const locations=[{id:'taxi',label:'🚕 택시',x:67,y:73,desc:'목적지까지 택시 이동'},{id:'house',label:'🏠 주인공 집',x:13,y:73,desc:'휴식과 하루 마무리'},{id:'flower',label:'💐 꽃집',x:20,y:42,desc:'꽃 선물 구매'},{id:'starbucks',label:'☕ 카페',x:39,y:43,desc:'한서윤과의 만남'},{id:'gukbap',label:'🍲 국밥집',x:54,y:41,desc:'식사로 체력 회복'},{id:'park',label:'🌳 공원',x:61,y:24,desc:'산책과 휴식'},{id:'pet',label:'🐶 애견샵',x:82,y:30,desc:'강아지와의 만남'},{id:'cu',label:'🏪 CU 편의점',x:74,y:48,desc:'생활용품 구매'},{id:'bus',label:'🚌 버스정류장',x:59,y:70,desc:'다른 지역으로 이동'}];
const officeLocations=[
{id:'office',label:'🏢 회사',x:39,y:26},{id:'hospital',label:'🏥 병원',x:69,y:30},{id:'gym',label:'🏋️ 헬스장',x:13,y:39},
{id:'bookstore',label:'📚 서점',x:12,y:59},{id:'restaurant',label:'🍽️ 식당',x:32,y:60},{id:'pub',label:'🍻 술집',x:49,y:58},
{id:'mall',label:'🛍️ 쇼핑몰',x:64,y:45},{id:'officeCu',label:'🏪 편의점',x:78,y:61},
{id:'officePark',label:'🌳 소공원',x:18,y:82},{id:'officeBus',label:'🚌 버스정류장',x:49,y:79},{id:'officeTaxi',label:'🚕 택시',x:64,y:75}];
Object.assign(OPEN_HOURS,{office:[0,1,2,3,4],hospital:[0,1,2,3,4,5],gym:[0,1,2,3,4],bookstore:[0,1,2,3],restaurant:[1,2,3,4],pub:[3,4,5],mall:[0,1,2,3],officeCu:[0,1,2,3,4,5],officePark:[0,1,2,3,4,5],officeBus:[0,1,2,3],officeTaxi:[0,1,2,3,4,5]});
function areaLabel(id){return id==='office'?'회사 주변':'우리 동네'}
function travel(destination,mode,departureSlot=st.slot){
 if(destination===st.mapId){showChoices('교통 안내','이미 해당 지역에 있습니다.',[['확인',closePanel]]);return}
 if(mode==='bus'&&!busOperating(departureSlot)){showChoices('🚌 운행 종료','밤과 새벽에는 버스가 운행하지 않습니다.',[['확인',closePanel]]);return}
 const fare=mode==='bus'?BUS_FARE:taxiFare(departureSlot);
 if(st.money<fare){showChoices('교통비 부족',fare.toLocaleString()+'원이 필요합니다. 현재 소지금이 부족합니다.',[['확인',closePanel]]);return}
 st.money-=fare;st.mapId=destination;st.logs.push((mode==='bus'?'버스':'택시')+' '+areaLabel(destination)+' 이동 '+fare.toLocaleString()+'원');update();refreshTownVisual();renderSpots();
 showChoices(mode==='bus'?'🚌 버스 이동':'🚕 택시 이동',areaLabel(destination)+'에 도착했습니다. '+fare.toLocaleString()+'원이 차감되었습니다.',[['지도 보기',closePanel]]);
}
function officeEvent(id){
 const back=['지도로 돌아가기',closePanel];
 if(id==='office')return showChoices('🏢 회사','업무와 동료들이 기다리고 있습니다. 월급은 30일차마다 2,000,000원씩 지급됩니다.',[
 ['업무 수행 (급여일: 매 30일)',()=>{st.flags.workDays=(Number(st.flags.workDays)||0)+1;st.logs.push(st.day+'일차 회사 근무');update();showChoices('업무 완료','오늘의 업무를 마쳤습니다. 급여는 30일 간격으로 지급됩니다.',[back])}],
 ['동료와 대화하기',()=>{if(blockedByDebt())return;st.relation+=1;st.mood=Math.min(100,st.mood+3);st.logs.push('회사 동료와 대화');update();showChoices('동료와의 대화','동료와 일상 이야기를 나눴습니다.',[back])}],back]);
 if(id==='hospital')return showChoices('🏥 병원','회사 옆 병원입니다. 응급 치료와 체력 회복을 받을 수 있습니다.',[['링거 치료 (70,000원 · 체력 완전 회복)',()=>{st.money-=70000;st.hp=100;st.logs.push('병원 링거 치료');update();showChoices('치료 완료','체력이 완전히 회복되었습니다.',[back])}],back]);
 if(id==='gym')return showChoices('🏋️ 헬스장','운동으로 건강을 관리하고 회사 동료를 만날 수 있습니다.',[['운동하기 (10,000원 · 기분 +10)',()=>purchase('헬스장 이용',10000,0,10)],['동료와 운동하기',()=>{if(blockedByDebt())return;st.relation++;st.mood=Math.min(100,st.mood+5);update();showChoices('운동 친구','회사 동료와 함께 운동했습니다.',[back])}],back]);
 if(id==='bookstore')return showChoices('📚 서점','업무에 도움 되는 책과 소설이 있습니다.',[['자기계발서 구매 (15,000원)',()=>purchase('자기계발서',15000)],['소설 구매 (12,000원)',()=>purchase('소설',12000,0,5)],back]);
 if(id==='restaurant')return showChoices('🍽️ 식당','회사 동료와 식사할 수 있는 식당입니다.',[['점심·저녁 식사 (12,000원 · 체력 +15)',()=>purchase('식사',12000,15,5)],back]);
 if(id==='pub')return showChoices('🍻 술집','퇴근 후 동료들과 이야기를 나눌 수 있는 곳입니다.',[['동료와 한잔하기 (18,000원 · 관계 +1)',()=>{if(blockedByDebt())return;if(st.money<18000)return showChoices('술집','돈이 부족합니다.',[back]);st.money-=18000;st.relation++;st.mood=Math.min(100,st.mood+8);st.logs.push('동료와 술자리');update();showChoices('술자리','동료와 가까워졌습니다.',[back])}],back]);
 if(id==='mall')return showChoices('🛍️ 쇼핑몰','퇴근 후 쇼핑이나 데이트를 준비할 수 있습니다.',[['의류 구매 (35,000원)',()=>purchase('새 옷',35000,0,8)],['향수 구매 (28,000원)',()=>purchase('향수',28000,0,5)],back]);
 if(id==='officeCu')return showChoices('🏪 회사 앞 편의점','24시간 운영합니다.',[['간식 구매 (2,500원)',()=>purchase('간식',2500,0,4)],['생수 구매 (1,000원)',()=>purchase('생수',1000,3)],back]);
 if(id==='officePark')return showChoices('🌳 소공원','잠시 쉬면서 회사 생활을 돌아볼 수 있습니다.',[['산책하기 (기분 +10)',()=>{st.mood=Math.min(100,st.mood+10);update();showChoices('산책 완료','잠시 마음을 정리했습니다.',[back])}],back]);
 if(id==='officeBus')return showChoices('🚌 회사 앞 버스정류장','집까지 편도 1,800원입니다.',[['우리 동네로 이동 (1,800원)',()=>travel('town','bus',st.flags.lastEntrySlot)],back]);
 if(id==='officeTaxi')return showChoices('🚕 회사 앞 택시','우리 동네까지 '+taxiFare(st.flags.lastEntrySlot).toLocaleString()+'원입니다.',[['우리 동네로 이동',()=>travel('town','taxi',st.flags.lastEntrySlot)],back]);
}
const stories=[
{say:'어서 오세요! 처음 뵙는 분 같은데… 이사 오신 거예요?',options:[['네, 최근에 이사 왔어요.',2,'아, 그러셨구나! 앞으로 자주 뵙겠네요.'],['좋은 카페네요. 자주 올 것 같아요.',1,'감사해요. 편하게 들러 주세요!'],['커피 한 잔 주세요. (4,500원)',0,'네, 아메리카노 준비해 드릴게요.',4500]]},
{say:'어? 저번에 오셨던 분이네요. 오늘은 어떠셨어요?',options:[['바빴지만 괜찮았어요.',2,'고생 많으셨어요. 커피 한잔하며 쉬세요.'],['여기 커피가 생각났어요.',1,'후후, 그러셨구나. 오늘도 같은 메뉴로 드릴까요?'],['그냥 쉬고 싶어요.',0,'네, 편하게 쉬다 가세요.']]},
{say:'혹시 근처에 산책하기 좋은 곳 아세요?',options:[['언제 같이 가 보실래요?',2,'아, 오늘은 일이 있어서요. 다음에 기회가 된다면요.'],['공원 쪽이 예쁘더라고요.',1,'저도 한번 가봐야겠네요!'],['아직 동네를 잘 몰라요.',0,'저도 여기 온 지 얼마 안 됐어요.']]}];
function persist(){try{localStorage.setItem('love-practice-map-v1',JSON.stringify(st))}catch(e){console.warn(e)}}
function save(){persist();alert('게임이 저장되었습니다.')}
function update(){
 $('player').textContent='Lv.1 '+(st.name||'이름 미설정');$('hp').textContent=st.hp;$('mood').textContent=st.mood;$('love').textContent=st.relation;
 $('money').textContent='🪙 '+st.money.toLocaleString()+'원';
 $('clock').textContent='📅 '+st.day+'일차　☀️ '+TIME_SLOTS[st.slot]+'　('+(st.slot+1)+'/6)';
 $('quest').textContent=st.stage===0?'□ 카페에서 한서윤과 첫 인사':st.stage<3?'☑ 한서윤과 첫 인사　□ 다시 카페 방문':'☑ 첫 번째 이야기 완료';persist();
}
function paySalary(){
 const last=Number(st.flags.lastPayday)||0;
 const payday=Math.floor(st.day/30)*30;
 if(payday>=30&&payday>last){const count=Math.floor((payday-last)/30);const salary=2000000*count;st.money+=salary;st.flags.lastPayday=payday;st.logs.push(payday+'일차 월급 '+salary.toLocaleString()+'원 지급');st.flags.salaryNotice=salary}
}
function advance(slots=1,{rest=false}={}){
 const n=Math.max(0,Math.floor(Number(slots)||0));if(!n)return;
 const total=st.slot+n;st.day+=Math.floor(total/6);st.slot=total%6;paySalary();
 if(!rest){const before=st.hp;st.hp=Math.max(0,st.hp-20*n);if(before>20&&st.hp===20)st.flags.tiredWarning=true;if(before>0&&st.hp===0)st.flags.hospitalPending=true}
 update();refreshTownVisual();
}
function finishTimeConsequences(){
 if(st.flags.hospitalPending){st.flags.hospitalPending=false;st.flags.tiredWarning=false;st.money-=70000;st.hp=100;st.mapId='office';st.logs.push('과로로 쓰러져 병원에서 링거를 맞았다. 병원비 70,000원');update();refreshTownVisual();renderSpots();
 document.body.style.transition='filter .8s';document.body.style.filter='brightness(.05)';setTimeout(()=>{document.body.style.filter='brightness(1)';showChoices('🏥 회사 옆 병원','오늘은 무리했어. 정신을 차려보니 병원이다. 링거를 맞고 병원비 70,000원을 지불했다.',[['확인',closePanel]])},800);return true}
 if(st.flags.salaryNotice){const amount=st.flags.salaryNotice;delete st.flags.salaryNotice;showChoices('💰 월급 지급','월급 '+amount.toLocaleString()+'원이 입금되었습니다. 현재 잔액: '+st.money.toLocaleString()+'원',[['확인',closePanel]]);return true}
 if(st.flags.tiredWarning){st.flags.tiredWarning=false;showChoices('😫 피곤함','너무 피곤해, 집에가자. 그래도 계속 행동할 수 있습니다.',[['계속하기',closePanel]]);return true}return false;
}
function spendTime(){advance(1);if(!finishTimeConsequences())showChoices('⏳ 시간보내기','잠시 시간을 보냈습니다. 체력이 20 감소했습니다.',[['확인',closePanel]])}

function sleepNextDay(){
 advance(3,{rest:true});st.hp=100;st.mapId=HOME_MAP_ID;st.flags.tiredWarning=false;st.flags.hospitalPending=false;st.mood=Math.min(100,st.mood+10);update();refreshTownVisual();renderSpots();
 showChoices('휴식 완료','3때가 지나고 체력이 완전히 회복되었습니다.',[['동네로 돌아가기',closePanel]]);
}
function endAction(){update()}
function show(title,body){$('wrap').classList.remove('cafe-mode');$('panel').innerHTML='<button class="close" onclick="closePanel()">✕ 닫기</button><h2>'+title+'</h2>'+body;$('wrap').classList.add('show')}
function closePanel(){$('wrap').classList.remove('show','cafe-mode')}
function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b}
function showChoices(title,description,options){show(title,'<p>'+description+'</p><div class="options" id="options"></div>');const root=$('options');for(const [label,cb] of options)root.append(button(label,cb))}
function home(){closePanel();refreshTownVisual();renderSpots()}
function renderSpots(){const el=$('spots');el.replaceChildren();for(const l of (st.mapId==='office'?officeLocations:locations)){const b=document.createElement('button');b.className='spot';b.textContent=l.label;b.style.left=l.x+'%';b.style.top=l.y+'%';b.onclick=()=>visit(l.id);el.append(b)}}
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
 const count=Number(st.flags.cafePurchases)||0;
 if(count<20){seoyoonReply('안녕하세요. 어떤 걸로 드릴까요?',cafeMenuOptions());return}
 seoyoonReply('어? 오늘도 오셨네요. 이제 얼굴이 익숙해졌어요.',[
  ...CAFE_MENU.map(item=>[item.name+' ('+item.price.toLocaleString()+'원)',()=>cafeOrder(item.name,item.price)]),
  ['제 이름을 기억하세요?',()=>{st.relation+=1;st.logs.push('한서윤과 조금 더 친해졌다.');endAction();seoyoonReply('그럼요. 자주 오시는 손님이시잖아요.',[['동네로 돌아가기',closePanel]])}],
  ['동네로 돌아가기',closePanel]
 ]);
}
function cafeOrder(item,price){
 if(blockedByDebt())return;
 if(st.money<price){seoyoonReply('죄송하지만 결제 금액이 부족한 것 같아요.',[['동네로 돌아가기',closePanel]]);return}
 st.money-=price;st.flags.cafePurchases=(Number(st.flags.cafePurchases)||0)+1;st.items.push(item);st.mood=Math.min(100,st.mood+3);st.logs.push('카페 '+item+' 주문');endAction();
 seoyoonReply('네, '+item+' 준비해 드릴게요.',[['동네로 돌아가기',closePanel]]);
}
function purchase(item,price,hp=0,mood=0){if(blockedByDebt())return;if(st.money<price){alert('돈이 부족합니다.');return}st.money-=price;st.hp=Math.min(100,st.hp+hp);st.mood=Math.min(100,st.mood+mood);st.items.push(item);st.logs.push(item+' 구매');endAction();showChoices('구매 완료',item+'을(를) 구매했습니다.',[['동네로 돌아가기',closePanel]])}
function visit(id){const l=(st.mapId==='office'?officeLocations:locations).find(v=>v.id===id);if(!l)return;
 const arrivalSlot=st.slot;
 if(debtLocked()&&!['house','office','hospital'].includes(id))return blockedByDebt();
 if(!isOpen(id,arrivalSlot)){showChoices('영업 종료',l.label+'은(는) 현재 이용할 수 없습니다. 영업시간에 다시 방문해 주세요.',[['확인',closePanel]]);return}
 st.flags.lastEntrySlot=arrivalSlot;advance(1);st.visited=[...new Set([...st.visited,id])];persist();if(finishTimeConsequences())return;if(st.mapId==='office')return officeEvent(id);
if(id==='starbucks')return debtLocked()?blockedByDebt():storyAtCafe();if(id==='house')return showChoices('🏠 '+st.name+'의 집','오늘도 수고했어요. 잠시 쉬어갈까요?',[['휴식하기 (체력 +20)',()=>{st.hp=Math.min(100,st.hp+20);endAction();showChoices('휴식 완료','몸이 한결 가벼워졌습니다.',[['돌아가기',closePanel]])}],['잠자기 (3때 경과 · 체력 완전 회복)',()=>{sleepNextDay()}]]);if(id==='flower')return showChoices('💐 꽃집','화사한 꽃향기가 가득합니다.',[['꽃다발 구매 (12,000원)',()=>purchase('꽃다발',12000)],['동네로 돌아가기',closePanel]]);if(id==='cu')return showChoices('🏪 CU 편의점','오늘도 다양한 상품이 진열되어 있습니다.',[['생수 구매 (1,000원)',()=>purchase('생수',1000,3)],['간식 구매 (2,500원)',()=>purchase('간식',2500,0,4)],['동네로 돌아가기',closePanel]]);if(id==='gukbap')return showChoices('🍲 국밥집','진한 국물 냄새가 가게 안을 채웁니다.',[['국밥 먹기 (9,000원)',()=>purchase('국밥',9000,25,5)],['동네로 돌아가기',closePanel]]);if(id==='park')return showChoices('🌳 동네 공원','벚꽃잎이 바람에 흩날립니다.',[['산책하기 (기분 +10, 1때)',()=>{st.mood=Math.min(100,st.mood+10);endAction();showChoices('산책 완료','기분 좋은 바람을 맞으며 산책했습니다.',[['돌아가기',closePanel]])}],['동네로 돌아가기',closePanel]]);if(id==='pet')return showChoices('🐶 애견샵','귀여운 강아지들이 반갑게 맞이합니다.',[['강아지 구경하기 (기분 +5)',()=>{st.mood=Math.min(100,st.mood+5);endAction();showChoices('애견샵','강아지가 꼬리를 흔듭니다. 언젠가 반려동물을 키워볼까요?',[['돌아가기',closePanel]])}],['동네로 돌아가기',closePanel]]);if(id==='bus')return showChoices('🚌 버스정류장','회사까지 편도 1,800원입니다.',[['회사로 이동 (1,800원)',()=>travel('office','bus',arrivalSlot)],['동네로 돌아가기',closePanel]]);if(id==='taxi')return showChoices('🚕 택시','회사까지 요금 '+taxiFare(arrivalSlot).toLocaleString()+'원입니다.',[['회사로 이동',()=>travel('office','taxi',arrivalSlot)],['동네로 돌아가기',closePanel]])}
function schedule(){show('📅 일정','<p>오늘의 목표: '+(st.stage<3?'한서윤과의 관계를 발전시키기':'동네에서 자유롭게 생활하기')+'</p><p>버스정류장 회사 노선은 준비 중입니다.</p>')}
function people(){show('💗 인물 관계','<p>한서윤 · 카페 바리스타</p><p>호감도: '+st.relation+'</p><p>대화 진행: '+st.stage+'/3</p>')}
function inventory(){show('👜 가방','<p>소지금: '+st.money.toLocaleString()+'원</p><p>소지품: '+(st.items.join(', ')||'없음')+'</p>')}
function journal(){show('📒 기록',st.logs.length?st.logs.map((v,i)=>'<p>'+(i+1)+'. '+v.replace(/</g,'&lt;')+'</p>').join(''):'<p>아직 기록이 없습니다.</p>')}
function settings(){show('⚙️ 설정','<p>이름: '+(st.name||'미설정')+'</p><p>자동 저장: 켜짐</p><p><button onclick="save()">저장</button><button onclick="reset()">새 게임</button></p>')}
function reset(){if(confirm('기존 진행 기록을 초기화하고 새 게임을 시작할까요?')){st=defaultState();update();nameStart()}}
$('wrap').addEventListener('click',e=>{if(e.target===$('wrap'))closePanel()});addEventListener('pagehide',persist);
const DAY_MAP='assets/maps/town-map.png',EVENING_MAP='assets/maps/town-map-evening.png';
const OFFICE_DAY='assets/maps/office-map.png',OFFICE_EVENING='assets/maps/office-map-evening.png';
let eveningReady=false;
const eveningProbe=new Image();eveningProbe.onload=()=>{eveningReady=true;refreshTownVisual()};eveningProbe.onerror=()=>{eveningReady=false};eveningProbe.src=EVENING_MAP;
function refreshTownVisual(){const evening=st.slot>=3;const path=st.mapId==='office'?(evening?OFFICE_EVENING:OFFICE_DAY):(evening&&eveningReady?EVENING_MAP:DAY_MAP);const el=$('scene');if(el)el.style.backgroundImage='url("'+path+'")';const hint=document.querySelector('.footerHint');if(hint)hint.textContent='📍 '+areaLabel(st.mapId)+' · 건물 이름을 눌러 방문하세요'}
const probe=new Image();probe.onload=()=>{$('scene').classList.remove('fallback');$('scene').classList.add('loaded')};probe.onerror=()=>{$('mapStatus').textContent='⚠️ town-map.png 이미지를 불러오지 못했습니다. GitHub assets 폴더에서 파일을 확인해 주세요.'};probe.src='assets/maps/town-map.png?map=20261110b';renderSpots();update();refreshTownVisual();if(!st.name)nameStart();
