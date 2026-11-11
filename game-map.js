'use strict';
const $=id=>document.getElementById(id);
const defaultState=()=>({name:'',hp:100,mood:60,money:3000000,hunger:80,day:1,slot:0,mapId:'town',minutes:860,stage:0,relation:0,logs:[],items:[],visited:[],flags:{},scene:'town'});
let st=defaultState();
try{const raw=localStorage.getItem('love-practice-map-v1');if(raw)st={...st,...JSON.parse(raw)};else{const old=localStorage.getItem('love-practice-08');if(old){const v=JSON.parse(old);st={...st,hp:v.hp??100,mood:v.mood??60,money:v.money??3000000,day:v.day??1,slot:v.slot??0,minutes:v.minutes??860,stage:v.stage??0,relation:v.relation??0,logs:v.logs??[],items:v.items??[]}}}}catch(e){console.warn(e)}
const TIME_SLOTS=['아침','점심','낮','저녁','밤','새벽'];
const START_DATE=Date.UTC(2027,0,1);
function gameDate(day=st.day){return new Date(START_DATE+(day-1)*86400000)}
function dateLabel(day=st.day){const d=gameDate(day);return d.getUTCFullYear()+'년 '+(d.getUTCMonth()+1)+'월 '+d.getUTCDate()+'일 ('+['일','월','화','수','목','금','토'][d.getUTCDay()]+')'}
function monthEndDay(day=st.day){const d=gameDate(day);return Math.round((Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)-START_DATE)/86400000)+1}
function monthStartDay(day=st.day){const d=gameDate(day);return Math.round((Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)-START_DATE)/86400000)+1}

const HOME_MAP_ID='town',BUS_FARE=1800,TAXI_FARE_DAY=8000,TAXI_FARE_NIGHT=20000;
const OPEN_HOURS={house:[0,1,2,3,4,5],flower:[0,1,2,3],starbucks:[0,1,2,3],gukbap:[0,1,2,3,4,5],park:[0,1,2,3,4,5],pet:[0,1,2,3],cu:[0,1,2,3,4,5],bus:[0,1,2,3],taxi:[0,1,2,3,4,5]};
function isOpen(id,slot=st.slot){return (OPEN_HOURS[id]||[]).includes(slot)}
const PHONE_PLANS={light:{name:'라이트',fee:15000,data:0},basic:{name:'베이직',fee:70000,data:2},super:{name:'슈퍼',fee:150000,data:Infinity}};
const MONTHLY_RENT=700000,MONTHLY_UTILITIES=90000,INDUSTRY_AVG_SALARY=36000000;
function ensureLife(){st.flags=st.flags||{};if(!st.flags.life){st.flags.life={employment:'unemployed',company:null,application:null,interview:null,phonePlan:'basic',dataUsed:0,contacts:[],messages:[],lastBillsDay:0,lastSalaryDay:0,attended:[],monthlyPay:0};}return st.flags.life}
function phoneMessage(sender,body){const l=ensureLife();l.messages.unshift({sender,body,day:st.day,read:false});st.logs.push('📱 '+sender+' 문자 도착');persist()}
function debtLocked(){return st.money<0}
function blockedByDebt(){if(!debtLocked())return false;showChoices('생활비 부족','현재 잔액이 없어서 소비활동을 할 수 없습니다.',[['확인',closePanel]]);return true}
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
 st.money-=fare;st.flags.currentLocation=null;st.logs.push((mode='bus'?'버스':'택시')+' '+areaLabel(destination)+' 이동 '+fare.toLocaleString()+'원');update();
 const scene=$('scene');scene.classList.add('travel-fade');
 setTimeout(()=>{st.mapId=destination;refreshTownVisual();renderSpots();update();
 showChoices(mode==='bus'?'🚌 버스 이동':'🚕 택시 이동',areaLabel(destination)+'에 도착했습니다. '+fare.toLocaleString()+'원이 차감되었습니다.',[['지도 보기',closePanel]]);
 setTimeout(()=>scene.classList.remove('travel-fade'),90);},550);
}
function lateOfficeEvent(){
 show('🏢 회사 · 김윤석 대리','<div class="late-office-event"><img src="assets/characters/office/01.png" alt="김윤석 대리"><div class="late-office-dialog"><strong>김윤석 대리</strong><p>해가 중천에 떴는데, 이제 출근하는거야?!</p><div id="options" class="options"></div></div></div>');
 $('options').append(button('죄송합니다. 업무를 시작하겠습니다.',()=>officeEvent('office')));
}
const INTERVIEW_QUESTIONS=[
 {q:'지원한 회사에서 가장 중요하게 생각하는 것은 무엇인가요?',answers:[['회사의 목표와 고객을 이해하는 것',2],['정해진 일만 처리하는 것',0],['높은 연봉과 편한 업무',-1]]},
 {q:'업무 중 예상하지 못한 문제가 발생하면 어떻게 하겠습니까?',answers:[['상황을 파악하고 해결책을 제안합니다',2],['동료와 협력해 해결합니다',1],['상사의 지시가 올 때까지 기다립니다',0]]},
 {q:'동료와 의견이 충돌하면 어떻게 하겠습니까?',answers:[['근거를 공유하고 합의점을 찾겠습니다',2],['먼저 상대방 의견을 듣겠습니다',1],['제 의견을 끝까지 고수합니다',-1]]},
 {q:'업무 마감이 촉박한 상황에서는 어떻게 하겠습니까?',answers:[['우선순위를 조정하고 진행 상황을 공유합니다',2],['필요하면 동료에게 도움을 요청합니다',1],['일단 혼자 해결할 때까지 버팁니다',0]]},
 {q:'입사 후 어떤 직원으로 성장하고 싶습니까?',answers:[['성과를 만들고 팀에 기여하는 직원',2],['맡은 업무를 꾸준히 수행하는 직원',1],['가능하면 책임이 적은 직원',-1]]}
];
const COMPANIES=[{id:'haneul',name:'하늘소프트',industry:'IT·서비스',average:INDUSTRY_AVG_SALARY},{id:'mirae',name:'미래마케팅',industry:'광고·마케팅',average:34000000},{id:'sejong',name:'세종유통',industry:'유통·영업',average:32000000}];
const JOB_ROLES=[
 {id:'development',name:'IT·개발',description:'프로그램과 서비스를 만드는 업무'},
 {id:'marketing',name:'마케팅·광고',description:'브랜드와 광고 캠페인을 운영하는 업무'},
 {id:'sales',name:'영업',description:'고객을 만나 계약과 매출을 만드는 업무'},
 {id:'planning',name:'기획·전략',description:'사업과 서비스를 기획하는 업무'},
 {id:'design',name:'디자인',description:'화면과 콘텐츠를 디자인하는 업무'},
 {id:'management',name:'경영지원',description:'인사·총무·회계 등 회사 운영 업무'}
];
const JOB_LEVEL_DAYS=[0,75,250,625,1250,2500];
function jobRole(id){return JOB_ROLES.find(r=>r.id===id)}
function jobExperience(l=ensureLife()){
 if(!l.jobExperience||typeof l.jobExperience!=='object')l.jobExperience={};
 return l.jobExperience;
}
function jobLevel(days){let level=1;for(let i=1;i<JOB_LEVEL_DAYS.length;i++)if(days>=JOB_LEVEL_DAYS[i])level=i+1;return level}
function roleCareerSummary(l=ensureLife()){
 const r=jobRole(l.roleId),days=r?(jobExperience(l)[r.id]||0):0,level=jobLevel(days);
 return r?r.name+' · 숙련도 Lv.'+level+' ('+days+'일)':'직군 미선택';
}
const PROMOTION_OVERTIME=200,PROMOTION_WORKDAYS=365;
function career(l=ensureLife()){
 if(!l.career||l.career.company!==l.company||l.career.startDay!==l.startDay){
  l.career={company:l.company,startDay:l.startDay,workDays:0,overtimeDays:0,rank:0,promotions:[]};
  if(l.employment==='hired'&&Array.isArray(l.attended))l.career.workDays=l.attended.filter(d=>d>=l.startDay&&d<=st.day).length;
 }
 return l.career;
}
function checkPromotion(l,reason){
 const c=career(l);
 if(c.rank>0)return false;
 if(c.overtimeDays<PROMOTION_OVERTIME&&c.workDays<PROMOTION_WORKDAYS)return false;
 c.rank=1;c.promotions.push({day:st.day,reason,company:l.company});
 const why=c.overtimeDays>=PROMOTION_OVERTIME?'야근 200일':'근무 365일';
 st.logs.push(dateLabel()+' '+l.company+' 승진 ('+why+')');
 phoneMessage(l.company+' 인사팀','축하합니다! 동일 회사에서 '+why+' 기준을 충족해 승진했습니다.');
 return true;
}
function companyLobby(){
 const l=ensureLife(),a=l.application;
 if(l.employment==='hired'){
  if(st.day<l.startDay)return showChoices('🏢 '+l.company,'첫 출근일은 '+dateLabel(l.startDay)+'입니다.',[['돌아가기',closePanel]]);
  if(l.attended.includes(st.day))return showChoices('🏢 '+l.company,'오늘은 이미 근무했습니다.',[['돌아가기',closePanel]]);
  const late=st.flags.lastEntrySlot===2;
  if(st.flags.lastEntrySlot!==0&&!late)return showChoices('🏢 '+l.company,'아침에는 정상 출근, 낮에는 지각 출근할 수 있습니다.',[['돌아가기',closePanel]]);
  return showChoices('🏢 '+l.company,late?'지각 출근입니다. 근무는 가능하지만 3회 누적 시 해고됩니다.':'정상 출근입니다. 아침부터 저녁까지 근무합니다.',[['업무 수행',()=>workShift(l,late)],['돌아가기',closePanel]]);
 }
 if(a&&a.status==='submitted')return showChoices('🏢 회사 면접 안내',a.company+' 입사지원서를 제출했습니다.',[['면접 보기',startInterview],['돌아가기',closePanel]]);
 if(a&&a.status==='interviewed')return showChoices('🏢 채용 진행 중','면접 결과는 7일 이내 문자로 안내됩니다.',[['돌아가기',closePanel]]);
 return showChoices('🏢 오피스 빌딩','여러 회사가 입주한 건물입니다. 입사지원은 집에서 가능합니다.',[['돌아가기',closePanel]]);
}
function workShift(l,late){
 if(l.attended.includes(st.day))return companyLobby();
 const workDay=st.day;l.attended.push(workDay);
 const c=career(l);c.workDays++;
 if(l.roleId&&jobRole(l.roleId)){const xp=jobExperience(l),before=xp[l.roleId]||0;xp[l.roleId]=before+1;if(jobLevel(before)<jobLevel(xp[l.roleId])){const r=jobRole(l.roleId);phoneMessage('커리어 성장',r.name+' 숙련도가 Lv.'+jobLevel(xp[l.roleId])+'로 상승했습니다!');st.logs.push(dateLabel(workDay)+' '+r.name+' 숙련도 Lv.'+jobLevel(xp[l.roleId])+' 달성')}}
 earningsLedger().push({day:workDay,company:l.company,amount:l.monthlyPay||70000,paid:false});
 st.logs.push(dateLabel(workDay)+' '+l.company+(late?' 지각 출근':' 정상 출근'));
 if(late)l.lateCount=(l.lateCount||0)+1;
 if(st.slot<3)advance(3-st.slot,{rest:true});
 st.hp=Math.max(0,st.hp-20);
 if(late&&l.lateCount>=3){
  const company=l.company;l.employment='unemployed';l.company=null;l.application=null;l.startDay=null;l.lateCount=0;l.career=null;l.roleId=null;
  phoneMessage(company+' 인사팀','지각 누적 3회로 해고되었습니다. 근무한 날짜의 급여는 월말 정산됩니다.');
  update();return showChoices('🏢 해고 통보','지각 출근 3회 누적으로 해고되었습니다. 오늘 근무는 급여에 포함됩니다.',[['퇴근하기',closePanel]]);
 }
 const promoted=checkPromotion(l,'work');
 update();showChoices('🏢 근무 종료','저녁이 되었습니다. 오늘의 근무 급여가 적립되었습니다.'+(promoted?' 🎉 승진했습니다!':'')+(late?' 지각 누적 '+l.lateCount+'/3회.':''),[['정시 퇴근하기',closePanel],['야근하기 (체력 -40)',()=>{st.hp=Math.max(0,st.hp-40);advance(1,{rest:true});st.logs.push(dateLabel(workDay)+' 야근 (체력 -40)');const c=career(l);if(c.lastOvertimeDay!==workDay){c.overtimeDays++;c.lastOvertimeDay=workDay;}const promoted=checkPromotion(l,'overtime');update();if(st.hp===0){st.flags.hospitalPending=true;if(finishTimeConsequences())return;}showChoices('🌙 야근 종료','야근을 마치니 밤이 되었습니다. 체력이 40 감소했습니다.'+(promoted?' 🎉 승진했습니다!':''),[['회사 밖으로 나가기',closePanel]])}]]);
}
function jobSearch(){
 const l=ensureLife();
 if(l.employment==='hired')return showChoices('💻 취업 사이트','현재 '+l.company+'에 재직 중입니다. 직무: '+roleCareerSummary(l),[['돌아가기',closePanel]]);
 if(l.application&&['submitted','interviewed'].includes(l.application.status))return showChoices('💻 입사지원 현황',l.application.company+' · '+(jobRole(l.application.roleId)?.name||'직군 미지정')+' 채용 절차가 진행 중입니다.',[['돌아가기',closePanel]]);
 showChoices('💻 채용공고','지원할 회사를 선택하세요. (인터넷 연결: 집 Wi-Fi)',COMPANIES.map(c=>[c.name+' · '+c.industry,()=>selectJobRole(c)]).concat([['돌아가기',closePanel]]));
}
function selectJobRole(company){
 const l=ensureLife(),xp=jobExperience(l);
 showChoices('💼 지원 직군 선택',company.name+'에서 지원할 직군을 선택하세요. 직군별 근무 경력은 이직 후에도 누적됩니다.',JOB_ROLES.map(r=>[r.name+' · Lv.'+jobLevel(xp[r.id]||0),()=>{
  l.application={company:company.name,companyId:company.id,roleId:r.id,status:'submitted',submittedDay:st.day};
  st.logs.push(company.name+' '+r.name+' 입사지원서 제출');update();
  showChoices('지원 완료',company.name+' · '+r.name+' 직군에 지원했습니다. 회사 건물에서 면접을 볼 수 있습니다.',[['확인',closePanel]]);
 }]).concat([['회사 다시 선택',jobSearch]]));
}
function startInterview(){
 const l=ensureLife(),a=l.application;if(!a||a.status!=='submitted')return companyLobby();
 a.score=0;a.question=0;interviewQuestion();
}
function interviewQuestion(){
 const a=ensureLife().application,idx=a.question;
 if(idx>=INTERVIEW_QUESTIONS.length)return salaryNegotiation();
 const q=INTERVIEW_QUESTIONS[idx];
 showChoices('🎤 면접 '+(idx+1)+'/5',q.q,q.answers.map(([answer,score])=>[answer,()=>{a.score+=score;a.question++;interviewQuestion()}]));
}
function salaryNegotiation(){
 const a=ensureLife().application,c=COMPANIES.find(c=>c.id===a.companyId)||COMPANIES[0];
 const options=[0.8,0.9,1,1.1,1.25].map(r=>{const salary=Math.round(c.average*r/1000000)*1000000;return ['희망연봉 '+salary.toLocaleString()+'원',()=>finishInterview(salary,c.average)]});
 showChoices('💼 희망연봉 협상','업계 평균연봉: '+c.average.toLocaleString()+'원. 평균 이하를 제시하면 채용 확률이 높아집니다.',options);
}
function finishInterview(offer,average){
 const a=ensureLife().application;
 const chance=Math.max(.12,Math.min(.95,.48+a.score*.055+(average-offer)/average*.65));
 // Deterministic draw per applicant and day so reload cannot reroll the result.
 const seed=(st.day*73+a.score*31+offer/1000000*17+a.company.length*13)%100;
 a.passed=seed/100<chance;a.offer=offer;a.chance=Math.round(chance*100);a.resultDay=st.day+1+((st.day+a.score+offer/1000000)%7+7)%7;a.status='interviewed';
 update();showChoices('면접 종료','면접이 끝났습니다. 채용 결과는 7일 이내 휴대폰 문자로 통보됩니다.',[['확인',closePanel]]);
}
function monthlyExpenseForecast(){
 const l=ensureLife(),plan=PHONE_PLANS[l.phonePlan]||PHONE_PLANS.basic;
 const nextDay=monthEndDay();
 const total=MONTHLY_RENT+MONTHLY_UTILITIES+plan.fee;
 const fmt=n=>n.toLocaleString()+'원';
 const expectedSalary=monthEarnings(nextDay).total;
 const forecast='다음 정산일: '+dateLabel(nextDay)+'<br>월세: '+fmt(MONTHLY_RENT)+'<br>공과금: '+fmt(MONTHLY_UTILITIES)+'<br>휴대폰 ('+plan.name+'): '+fmt(plan.fee)+'<br>고정지출 합계: '+fmt(total)+'<br>현재 소지금: '+fmt(st.money)+'<br>현재 출근 기록 기준 예상 급여: '+fmt(expectedSalary)+'<br>예상 정산 후 잔액: '+fmt(st.money+expectedSalary-total);
 return forecast;
}
function showExpenseForecast(back=phone){
 showChoices('💳 이번 달 말 지출 예정',monthlyExpenseForecast(),[['돌아가기',back]]);
}
function phone(){
 const l=ensureLife(),plan=PHONE_PLANS[l.phonePlan]||PHONE_PLANS.basic;
 showChoices('📱 휴대폰','요금제: '+plan.name+' · 데이터 '+(plan.data===Infinity?'무제한':plan.data+'GB')+' · 이번 달 사용 '+l.dataUsed.toFixed(1)+'GB',[
 ['문자함 ('+l.messages.length+')',()=>{l.messages.forEach(m=>m.read=true);showChoices('✉️ 문자함',l.messages.length?l.messages.slice(0,12).map(m=>m.day+'일차 ['+m.sender+'] '+m.body).join('　|　'):'도착한 문자가 없습니다.',[['휴대폰으로',phone]])}],
 ['연락처',()=>showChoices('📇 연락처',l.contacts.length?l.contacts.join(', '):'아직 저장된 연락처가 없습니다. 앞으로 등장인물과 친해지면 연락처를 받을 수 있습니다.',[['휴대폰으로',phone]])],
 ['요금제 변경',phonePlans],
 ['이번 달 말 지출 예정',()=>showExpenseForecast(phone)],
 ['이메일',()=>openInternetApp('메일')],['유튜브',()=>openInternetApp('유튜브')],
 ['돌아가기',closePanel]]);
}
function openInternetApp(app){if(!canUseData(st.mapId==='town'&&st.flags.currentLocation==='house'))return;showChoices('🌐 '+app,app==='메일'?'새로운 이메일이 없습니다.':'동영상 서비스를 둘러봤습니다. 모바일 데이터 0.1GB가 사용될 수 있습니다.',[['휴대폰으로',phone]])}
function phonePlans(){
 const l=ensureLife(),current=PHONE_PLANS[l.phonePlan]||PHONE_PLANS.basic;
 showChoices('📶 휴대폰 요금제','현재 사용 중: '+current.name+' · 월 '+current.fee.toLocaleString()+'원<br>모든 요금제에 문자·통화 기본 제공. 변경한 요금은 다음 정기 청구일부터 적용됩니다.',Object.entries(PHONE_PLANS).map(([id,p])=>[(id===l.phonePlan?'✓ 사용 중 · ':'')+p.name+' · 월 '+p.fee.toLocaleString()+'원 · '+(p.data===Infinity?'데이터 무제한':p.data===0?'데이터 없음':'데이터 '+p.data+'GB')+' · 문자·통화 기본',()=>{if(id===l.phonePlan)return showChoices('📶 현재 요금제',p.name+' 요금제를 사용 중입니다.',[['요금제 목록',phonePlans],['휴대폰으로',phone]]);l.phonePlan=id;update();showChoices('요금제 변경',p.name+' 요금제로 변경했습니다. 다음 청구일에 해당 요금이 적용됩니다.',[['휴대폰으로',phone]])}]).concat([['휴대폰으로',phone]]));
}
function canUseData(wifi=st.mapId==='town'){
 const l=ensureLife(),p=PHONE_PLANS[l.phonePlan]||PHONE_PLANS.basic;
 if(wifi)return true;
 if(p.data===0||l.dataUsed>=p.data){showChoices('📶 데이터 연결 불가','현재 위치에서는 Wi-Fi가 없거나 모바일 데이터 사용이 제한되어 인터넷을 이용할 수 없습니다.',[['휴대폰으로',phone]]);return false}
 l.dataUsed=Math.min(p.data,l.dataUsed+.1);persist();return true;
}
function officeEvent(id){
 const back=['지도로 돌아가기',closePanel];
 if(id==='office')return companyLobby();
 if(id==='hospital')return showChoices('🏥 병원','회사 옆 병원입니다. 응급 치료와 체력 회복을 받을 수 있습니다.',[['링거 치료 (70,000원 · 체력 완전 회복)',()=>{st.money-=70000;st.hp=100;st.logs.push('병원 링거 치료');update();showChoices('치료 완료','체력이 완전히 회복되었습니다.',[back])}],back]);
 if(id==='gym')return showChoices('🏋️ 헬스장','운동으로 건강을 관리하고 회사 동료를 만날 수 있습니다.',[['운동하기 (10,000원 · 기분 +10)',()=>purchase('헬스장 이용',10000,0,10)],['동료와 운동하기',()=>{if(blockedByDebt())return;st.relation++;st.mood=Math.min(100,st.mood+5);update();showChoices('운동 친구','회사 동료와 함께 운동했습니다.',[back])}],back]);
 if(id==='bookstore')return showChoices('📚 서점','업무에 도움 되는 책과 소설이 있습니다.',[['자기계발서 구매 (15,000원)',()=>purchase('자기계발서',15000)],['소설 구매 (12,000원)',()=>purchase('소설',12000,0,5)],back]);
 if(id==='restaurant')return showChoices('🍽️ 식당','회사 동료와 식사할 수 있는 식당입니다.',[['점심·저녁 식사 (12,000원 · 체력 +20)',()=>purchase('식사',12000,20,5,45)],back]);
 if(id==='pub')return showChoices('🍻 술집','퇴근 후 동료들과 이야기를 나눌 수 있는 곳입니다.',[['동료와 한잔하기 (18,000원 · 관계 +1)',()=>{if(blockedByDebt())return;if(st.money<18000)return showChoices('술집','돈이 부족합니다.',[back]);st.money-=18000;st.relation++;st.mood=Math.min(100,st.mood+8);st.logs.push('동료와 술자리');update();showChoices('술자리','동료와 가까워졌습니다.',[back])}],back]);
 if(id==='mall')return showChoices('🛍️ 쇼핑몰','퇴근 후 쇼핑이나 데이트를 준비할 수 있습니다.',[['의류 구매 (35,000원)',()=>purchase('새 옷',35000,0,8)],['향수 구매 (28,000원)',()=>purchase('향수',28000,0,5)],back]);
 if(id==='officeCu')return showChoices('🏪 회사 앞 편의점','24시간 운영합니다.',[['도시락 구매 (5,500원 · 체력 +15)',()=>purchase('도시락',5500,15,0,35)],['햄버거 구매 (4,500원 · 체력 +10)',()=>purchase('햄버거',4500,10,0,25)],['빵 구매 (2,500원 · 체력 +10)',()=>purchase('빵',2500,10,0,20)],['생수 구매 (1,000원)',()=>purchase('생수',1000,3)],back]);
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
 if(!Number.isFinite(st.hunger))st.hunger=80;
 $('player').textContent='Lv.1 '+(st.name||'이름 미설정');$('hp').textContent=st.hp;$('mood').textContent=st.mood;$('love').textContent=st.relation;
 $('money').textContent='🪙 '+st.money.toLocaleString()+'원';
 const hungerEl=$('hunger');if(hungerEl)hungerEl.textContent=st.hunger;
 $('clock').textContent='📅 '+dateLabel()+' · '+st.day+'일차　☀️ '+TIME_SLOTS[st.slot]+'　('+(st.slot+1)+'/6)';
 $('quest').textContent=st.stage===0?'□ 카페에서 한서윤과 첫 인사':st.stage<3?'☑ 한서윤과 첫 인사　□ 다시 카페 방문':'☑ 첫 번째 이야기 완료';persist();
}
function earningsLedger(){
 const l=ensureLife();
 if(!Array.isArray(l.earnings))l.earnings=[];
 return l.earnings;
}
function monthEarnings(endDay=monthEndDay()){
 const start=monthStartDay(endDay),ledger=earningsLedger();
 const rows=ledger.filter(e=>e.day>=start&&e.day<=endDay&&!e.paid);
 return {rows,total:rows.reduce((sum,e)=>sum+e.amount,0)};
}
function paySalary(){
 const l=ensureLife();
 for(let d=(l.lastBillsDay||0)+1;d<=st.day;d++){
  if(d!==monthEndDay(d))continue;
  const plan=PHONE_PLANS[l.phonePlan]||PHONE_PLANS.basic,charges=MONTHLY_RENT+MONTHLY_UTILITIES+plan.fee;
  const due=monthEarnings(d),salary=due.total;
  st.money-=charges;l.lastBillsDay=d;l.dataUsed=0;
  phoneMessage('생활비 안내',dateLabel(d)+' 지출: 월세 '+MONTHLY_RENT.toLocaleString()+'원, 공과금 '+MONTHLY_UTILITIES.toLocaleString()+'원, 휴대폰 요금 ('+plan.name+') '+plan.fee.toLocaleString()+'원. 합계 '+charges.toLocaleString()+'원.');
  if(salary){st.money+=salary;due.rows.forEach(e=>e.paid=true);const byCompany={};for(const e of due.rows)byCompany[e.company]=(byCompany[e.company]||0)+e.amount;
   phoneMessage('급여 입금',dateLabel(d)+' 총 '+salary.toLocaleString()+'원 입금. '+Object.entries(byCompany).map(([name,amount])=>name+' '+amount.toLocaleString()+'원').join(', ')+'.');}
  st.logs.push(dateLabel(d)+' 정산: 급여 '+salary.toLocaleString()+'원 / 지출 '+charges.toLocaleString()+'원');
 }
}
function employmentTick(){
 const l=ensureLife(),a=l.application;
 if(a&&a.status==='interviewed'&&st.day>=a.resultDay){
  a.status=a.passed?'accepted':'rejected';
  if(a.passed){l.employment='hired';l.company=a.company;l.monthlyPay=Math.round(a.offer/260/1000)*1000;l.startDay=st.day+1;l.roleId=a.roleId||null;l.career=null;l.lateCount=0;phoneMessage(a.company+' 인사팀','최종 합격을 축하드립니다. '+(st.day+1)+'일차부터 출근해 주세요.');}
  else{l.employment='unemployed';phoneMessage(a.company+' 인사팀','안타깝게도 이번 채용에는 함께하지 못하게 되었습니다.');}
 }
}
function advance(slots=1,{rest=false}={}){
 const n=Math.max(0,Math.floor(Number(slots)||0));if(!n)return;
 const total=st.slot+n,previous=st.day;st.day+=Math.floor(total/6);st.slot=total%6;const target=st.day;for(let day=previous+1;day<=target;day++){st.day=day;employmentTick();paySalary()}st.day=target;
 st.hunger=Math.max(0,(Number.isFinite(st.hunger)?st.hunger:80)-n*4);
 if(!rest){const before=st.hp;st.hp=Math.max(0,st.hp-10*n-(st.hunger<=10?5*n:0));if(before>20&&st.hp===20)st.flags.tiredWarning=true;if(before>0&&st.hp===0)st.flags.hospitalPending=true}
 update();refreshTownVisual();
}
function finishTimeConsequences(){
 if(st.flags.hospitalPending){st.flags.hospitalPending=false;st.flags.tiredWarning=false;st.money-=70000;st.hp=100;st.mapId='office';st.logs.push('과로로 쓰러져 병원에서 링거를 맞았다. 병원비 70,000원');update();refreshTownVisual();renderSpots();
 document.body.style.transition='filter .8s';document.body.style.filter='brightness(.05)';setTimeout(()=>{document.body.style.filter='brightness(1)';showChoices('🏥 회사 옆 병원','오늘은 무리했어. 정신을 차려보니 병원이다. 링거를 맞고 병원비 70,000원을 지불했다.',[['확인',closePanel]])},800);return true}
 if(st.flags.salaryNotice){const notice=st.flags.salaryNotice;delete st.flags.salaryNotice;showChoices('💰 월급 지급','이번 급여 기간 '+notice.attended+'일 출근 × 70,000원 = '+notice.salary.toLocaleString()+'원이 입금되었습니다. 현재 잔액: '+st.money.toLocaleString()+'원',[['확인',closePanel]]);return true}
 if(st.flags.tiredWarning){st.flags.tiredWarning=false;showChoices('😫 피곤함','너무 피곤해, 집에가자. 그래도 계속 행동할 수 있습니다.',[['계속하기',closePanel]]);return true}return false;
}
function spendTime(){advance(1);if(!finishTimeConsequences())showChoices('⏳ 시간보내기','잠시 시간을 보냈습니다. 체력이 10 감소했습니다.',[['확인',closePanel]])}

function sleepNextDay(){
 advance(3,{rest:true});st.hp=Math.min(100,st.hp+80);st.mapId=HOME_MAP_ID;st.flags.tiredWarning=false;st.flags.hospitalPending=false;st.mood=Math.min(100,st.mood+10);update();refreshTownVisual();renderSpots();
 showChoices('휴식 완료','3때가 지나고 체력이 80 회복되었습니다.',[['동네로 돌아가기',closePanel]]);
}
function endAction(){update()}
function show(title,body){$('wrap').classList.remove('cafe-mode');$('panel').innerHTML='<h2>'+title+'</h2>'+body;$('wrap').classList.add('show')}
function closePanel(){$('wrap').classList.remove('show','cafe-mode')}
function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b}
function showChoices(title,description,options){show(title,'<p>'+description+'</p><div class="options" id="options"></div>');const root=$('options');if(options.length>=2&&options.every(([label])=>String(label).length<=16))root.classList.add('two-column');for(const [label,cb] of options)root.append(button(label,cb));$('panel').scrollTop=0}
function home(){st.flags.currentLocation=null;closePanel();refreshTownVisual();renderSpots()}
function renderSpots(){const el=$('spots');el.replaceChildren();for(const l of (st.mapId==='office'?officeLocations:locations)){const b=document.createElement('button');b.className='spot';b.textContent=l.label;b.style.left=l.x+'%';b.style.top=l.y+'%';b.onclick=()=>visit(l.id);el.append(b)}}
function nameStart(){show('🏠 새로운 동네에서의 시작','<p>게임에서 사용할 주인공 이름을 정해주세요. <strong>최대 4글자</strong>입니다.</p><input id="newName" maxlength="4" placeholder="이름 입력" autocomplete="off"><p><button id="nameGo">게임 시작하기</button></p>');$('nameGo').onclick=()=>{const v=Array.from($('newName').value.trim());if(!v.length||v.length>4){alert('이름은 1~4글자로 입력해 주세요.');return}st.name=v.join('');update();showOpeningStory()}}
function showOpeningStory(){
 const name=(st.name||'주인공').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 showChoices('서울, 첫 번째 날',
  '스물여덟 살, '+name+'. 지방에서 살던 나는 새로운 삶을 꿈꾸며 서울에 올라왔다.\n\n아직 직장은 없다. 아는 사람도 없다. 손에 쥔 돈은 300만 원, 그리고 작은 월세방 한 칸.\n\n낯선 도시에서 무엇부터 시작해야 할까?',
  [['이곳에서 내 인생을 시작한다',showOpeningDecision]]);
}
function showOpeningDecision(){
 showChoices('사람연습 · 인생의 시작',
  '이곳에서 나의 파란만장한 인생이 시작된다.\n\n취업을 할 것인가? 사람을 만날 것인가? 아니면 당장 오늘을 즐길 것인가?\n\n당신은 어떻게 할 것인가?',
  [['집에서 일자리를 찾아본다',()=>{closePanel();jobSearch()}],
   ['먼저 동네를 둘러본다',()=>{closePanel();renderSpots()}],
   ['휴대폰부터 확인한다',()=>{closePanel();phone()}]]);
}
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
function purchase(item,price,hp=0,mood=0,fullness=0){if(blockedByDebt())return;if(st.money<price){alert('돈이 부족합니다.');return}st.money-=price;st.hp=Math.min(100,st.hp+hp);st.hunger=Math.min(100,(Number.isFinite(st.hunger)?st.hunger:80)+fullness);st.mood=Math.min(100,st.mood+mood);st.items.push(item);st.logs.push(item+' 구매');endAction();showChoices('구매 완료',item+'을(를) 구매했습니다.',[['동네로 돌아가기',closePanel]])}
function visit(id){const l=(st.mapId==='office'?officeLocations:locations).find(v=>v.id===id);if(!l)return;
 const arrivalSlot=st.slot;
 if(debtLocked()&&!['house','office','hospital'].includes(id))return blockedByDebt();
 if(!isOpen(id,arrivalSlot)){showChoices('영업 종료',l.label+'은(는) 현재 이용할 수 없습니다. 영업시간에 다시 방문해 주세요.',[['확인',closePanel]]);return}
 st.flags.lastEntrySlot=arrivalSlot;st.flags.currentLocation=id;if(id!=='house'&&id!=='office')advance(1);st.visited=[...new Set([...st.visited,id])];persist();if(finishTimeConsequences())return;if(st.mapId==='office'){if(id==='office'&&arrivalSlot===2&&ensureLife().employment==='hired'&&st.day>=ensureLife().startDay)return lateOfficeEvent();return officeEvent(id)}
if(id==='starbucks')return debtLocked()?blockedByDebt():storyAtCafe();if(id==='house')return showChoices('🏠 '+st.name+'의 집','집에서는 Wi-Fi로 인터넷을 이용할 수 있습니다.',[['📺 TV 보기',watchTV],['인터넷으로 입사지원하기',jobSearch],['휴식하기 (체력 +20)',()=>{st.hp=Math.min(100,st.hp+20);endAction();showChoices('휴식 완료','몸이 한결 가벼워졌습니다.',[['돌아가기',closePanel]])}],['잠자기 (3때 경과 · 체력 +80)',()=>{sleepNextDay()}]]);if(id==='flower')return showChoices('💐 꽃집','화사한 꽃향기가 가득합니다.',[['꽃다발 구매 (12,000원)',()=>purchase('꽃다발',12000)],['동네로 돌아가기',closePanel]]);if(id==='cu')return showChoices('🏪 CU 편의점','오늘도 다양한 상품이 진열되어 있습니다.',[['생수 구매 (1,000원)',()=>purchase('생수',1000,3)],['도시락 구매 (5,500원 · 체력 +15)',()=>purchase('도시락',5500,15,0,35)],['햄버거 구매 (4,500원 · 체력 +10)',()=>purchase('햄버거',4500,10,0,25)],['빵 구매 (2,500원 · 체력 +10)',()=>purchase('빵',2500,10,0,20)],['동네로 돌아가기',closePanel]]);if(id==='gukbap')return showChoices('🍲 국밥집','진한 국물 냄새가 가게 안을 채웁니다.',[['국밥 먹기 (9,000원 · 체력 +20)',()=>purchase('국밥',9000,20,5,45)],['동네로 돌아가기',closePanel]]);if(id==='park')return showChoices('🌳 동네 공원','벚꽃잎이 바람에 흩날립니다.',[['산책하기 (기분 +10, 1때)',()=>{st.mood=Math.min(100,st.mood+10);endAction();showChoices('산책 완료','기분 좋은 바람을 맞으며 산책했습니다.',[['돌아가기',closePanel]])}],['동네로 돌아가기',closePanel]]);if(id==='pet')return showChoices('🐶 애견샵','귀여운 강아지들이 반갑게 맞이합니다.',[['강아지 구경하기 (기분 +5)',()=>{st.mood=Math.min(100,st.mood+5);endAction();showChoices('애견샵','강아지가 꼬리를 흔듭니다. 언젠가 반려동물을 키워볼까요?',[['돌아가기',closePanel]])}],['동네로 돌아가기',closePanel]]);if(id==='bus')return showChoices('🚌 버스정류장','회사까지 편도 1,800원입니다.',[['회사로 이동 (1,800원)',()=>travel('office','bus',arrivalSlot)],['동네로 돌아가기',closePanel]]);if(id==='taxi')return showChoices('🚕 택시','회사까지 요금 '+taxiFare(arrivalSlot).toLocaleString()+'원입니다.',[['회사로 이동',()=>travel('office','taxi',arrivalSlot)],['동네로 돌아가기',closePanel]])}
function watchTV(){const d=gameDate();showChoices('📺 TV · '+d.getUTCFullYear()+'년 '+(d.getUTCMonth()+1)+'월 주요 뉴스','아직 해당 월의 주요 뉴스가 등록되지 않았습니다.',[['집으로 돌아가기',()=>visit('house')],['TV 끄기',closePanel]])}
function schedule(){const l=ensureLife(),c=l.employment==='hired'?career(l):null;showChoices('📅 일정','현재 상태: '+(l.employment==='hired'?l.company+' 재직':'구직 중')+' · 다음 정산일: '+dateLabel(monthEndDay())+(c?'<br>직군 경력: '+roleCareerSummary(l):'')+(c?'<br>직급: '+(c.rank?'승진 직원':'신입 직원')+'<br>현 직장 근무: '+c.workDays+'/365일<br>현 직장 야근: '+c.overtimeDays+'/200일<br>승진 조건: 둘 중 하나 달성 (동일 회사 재직 기준)':''), [['이번 달 말 지출 예정',()=>showExpenseForecast(schedule)],['확인',closePanel]])}
function people(){show('💗 인물 관계','<p>한서윤 · 카페 바리스타</p><p>호감도: '+st.relation+'</p><p>대화 진행: '+st.stage+'/3</p>')}
function inventory(){
 const items=Array.isArray(st.items)?st.items:[],counts=new Map();
 for(const item of items){const name=String(item);counts.set(name,(counts.get(name)||0)+1)}
 const entries=[...counts.entries()],slots=Math.max(24,Math.ceil(entries.length/6)*6);
 show('👜 가방','<div class="inventory-info">💰 소지금 <strong>'+st.money.toLocaleString()+'원</strong>　 ·　 소지품 '+items.length+'개 / '+slots+'칸</div><div class="inventory-grid" id="inventoryGrid" aria-label="소지품 목록"></div><p class="inventory-hint">소지품 칸을 누르면 물품 이름과 보유 수량을 확인할 수 있습니다.</p><div class="options"><button id="inventoryBack">닫기</button></div>');
 const root=$('inventoryGrid');
 for(let i=0;i<slots;i++){const entry=entries[i],slot=document.createElement('button');slot.className='inventory-slot';slot.type='button';if(entry){const [name,qty]=entry;slot.textContent='🎒';const title=document.createElement('span');title.className='inventory-item-name';title.textContent=name;slot.append(title);if(qty>1){const badge=document.createElement('span');badge.className='inventory-qty';badge.textContent='×'+qty;slot.append(badge)}slot.onclick=()=>showChoices('🎒 '+name,'보유 수량: '+qty+'개. 현재는 소지품 확인 기능만 지원합니다.',[['가방으로 돌아가기',inventory],['닫기',closePanel]])}else{slot.disabled=true;slot.setAttribute('aria-label','빈 칸')}root.append(slot)}
 $('inventoryBack').onclick=closePanel;
}
function journal(){show('📒 기록',st.logs.length?st.logs.map((v,i)=>'<p>'+(i+1)+'. '+v.replace(/</g,'&lt;')+'</p>').join(''):'<p>아직 기록이 없습니다.</p>')}
function settings(){show('⚙️ 설정','<p>이름: '+(st.name||'미설정')+'</p><p>자동 저장: 켜짐</p><p><button onclick="save()">저장</button><button onclick="reset()">새 게임</button></p>')}
function reset(){if(confirm('기존 진행 기록을 초기화하고 새 게임을 시작할까요?')){st=defaultState();update();nameStart()}}
$('wrap').addEventListener('click',e=>{if(e.target===$('wrap'))closePanel()});addEventListener('pagehide',persist);
const DAY_MAP='assets/maps/town-map.png',EVENING_MAP='assets/maps/town-map-evening.png';
const OFFICE_DAY='assets/maps/office-map.png',OFFICE_EVENING='assets/maps/office-map-evening.png';
let eveningReady=false;
const eveningProbe=new Image();eveningProbe.onload=()=>{eveningReady=true;refreshTownVisual()};eveningProbe.onerror=()=>{eveningReady=false};eveningProbe.src=EVENING_MAP;
function refreshTownVisual(){const evening=st.slot>=3;const path=st.mapId==='office'?(evening?OFFICE_EVENING:OFFICE_DAY):(evening&&eveningReady?EVENING_MAP:DAY_MAP);const el=$('scene');if(el)el.style.backgroundImage='url("'+path+'")';const hint=document.querySelector('.footerHint');if(hint)hint.textContent='📍 '+areaLabel(st.mapId)+' · 건물 이름을 눌러 방문하세요'}
const probe=new Image();probe.onload=()=>{$('scene').classList.remove('fallback');$('scene').classList.add('loaded')};probe.onerror=()=>{$('mapStatus').textContent='⚠️ town-map.png 이미지를 불러오지 못했습니다. GitHub assets 폴더에서 파일을 확인해 주세요.'};probe.src='assets/maps/town-map.png?map=20261110b';renderSpots();update();refreshTownVisual();ensureLife();if(!st.name)nameStart();
