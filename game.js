const CHAINS = [
  {id:'physics',names:['铅笔头','物理“小黄书”','窦寻的物理笔记'],icons:['✏️','📒'],image:'item-03.webp'},
  {id:'music',names:['旧电池','缠住的耳机','窦寻的MP3'],icons:['🔋','🎧'],image:'item-04.webp'},
  {id:'court',names:['球场哨子','旧篮球','篮球与蓝白校服'],icons:['📣','🏀'],image:'item-06.webp'},
  {id:'parrot',names:['灰色羽毛','打开的鸟笼','灰鹦鹉'],icons:['🪶','🪺'],image:'item-01.webp'},
  {id:'dog',names:['一小包狗粮','旧项圈','小狗豆豆'],icons:['🦴','🦮'],image:'item-05.webp'},
  {id:'flower',names:['花店红绳','老成的花盆','金桔与蝴蝶兰'],icons:['🎀','🪴'],image:'item-02.webp'}
];
const QUESTS = [
  {name:'窦寻的转学第一天',hint:'课桌旁，一个不肯借笔记，一个偏要搭话。',needs:[['physics',2],['music',1]],reward:60,tag:'第一章 · 同桌',title:'从一张空课桌开始',text:'六中一班的新同桌针锋相对。窦寻的物理笔记和耳机，成了徐西临最早留意他的理由。',bg:1,left:1,right:6},
  {name:'篮球场边的少年们',hint:'徐团座抱着球踹开门，豆豆也守着旧院。',needs:[['court',2],['dog',2]],reward:90,tag:'第二章 · 少年',title:'有些门，要撞开才算数',text:'篮球、校服、三对三和一群吵闹同学，拼出了他们共同的少年时代。',bg:2,left:4,right:10},
  {name:'有灯亮着的家',hint:'外婆、灰鹦鹉和满屋饭香，接住两个少年。',needs:[['parrot',2],['physics',1]],reward:120,tag:'第三章 · 家人',title:'被留在饭桌旁的人',text:'灰鹦鹉在屋里学人说话。对窦寻来说，徐家的灯光第一次有了“家”的形状。',bg:4,left:5,right:7},
  {name:'“姥爷”花店重逢',hint:'年关细雪，后备箱里装满金桔和蝴蝶兰。',needs:[['flower',2],['music',2]],reward:160,tag:'第四章 · 重逢',title:'十三年后，旧人乍然相逢',text:'一辆顺风车拐进小胡同。沉默的车厢、循环的歌和老成的花店，把旧事重新推到眼前。',bg:3,left:1,right:2},
  {name:'推开同一扇门',hint:'校舍与纸笔会旧，愿意回头的人不会。',needs:[['court',2],['parrot',2],['flower',2]],reward:240,tag:'终章 · 过门',title:'旧人成新',text:'他们好过，也掰过。走过十三年窄路，最终还是把彼此写进了往后的寻常日子。',bg:5,left:5,right:6}
];
const PEOPLE=['徐西临 · 重逢','宋连元 · 旧巷','少年同学','徐西临 · 球场','徐西临 · 课堂','窦寻 · 雪夜','窦寻 · 窗前','李博志','老成','蔡敬','张老师','罗冰'];
const SIZE=42, boardEl=document.querySelector('#board');
let state={version:2,board:Array(SIZE).fill(null),score:0,energy:80,quest:0,selected:null,unlocked:2,merges:0};
let toastTimer;

const chainById=id=>CHAINS.find(c=>c.id===id);
function itemName(item){return chainById(item.chain).names[item.level]}
function itemKey(item){return `${item.chain}:${item.level}`}
function itemImage(item){const c=chainById(item.chain);return item.level===2?`assets/items/${c.image}`:null}
function load(){
  try{const saved=JSON.parse(localStorage.getItem('guomen-merge-v2'));if(saved?.version===2&&Array.isArray(saved.board)&&saved.board.length===SIZE)state={...state,...saved,selected:null}}catch(e){}
  if(state.board.every(x=>x===null)){
    const starters=[['physics',0],['music',0],['court',0],['parrot',0],['dog',0],['flower',0],['physics',1],['court',0],['music',0],['flower',0]];
    [2,4,7,10,13,17,21,28,33,38].forEach((cell,i)=>state.board[cell]={chain:starters[i][0],level:starters[i][1]});
  }
}
function save(){localStorage.setItem('guomen-merge-v2',JSON.stringify({...state,selected:null}))}
function countNeeded(need){return state.board.filter(x=>x&&x.chain===need[0]&&x.level===need[1]).length}
function canSubmit(){if(state.quest>=QUESTS.length)return false;const used={};return QUESTS[state.quest].needs.every(n=>{const key=n.join(':');used[key]=(used[key]||0)+1;return countNeeded(n)>=used[key]})}
function iconMarkup(item){const image=itemImage(item);return image?`<img src="${image}" alt="">`:chainById(item.chain).icons[item.level]}
function render(){
  boardEl.innerHTML='';
  state.board.forEach((item,i)=>{const b=document.createElement('button');b.className='cell'+(!item?' empty':'')+(state.selected===i?' selected':'')+(item?.level===2?' rare':'');b.dataset.i=i;b.setAttribute('role','gridcell');
    if(item){b.innerHTML=`<span class="item-level">${item.level+1}</span><span class="item-icon">${iconMarkup(item)}</span><span class="item-name">${itemName(item)}</span>`;b.setAttribute('aria-label',`${itemName(item)}，等级 ${item.level+1}`)}else b.setAttribute('aria-label','空格');boardEl.appendChild(b)});
  document.querySelector('#memoryScore').textContent=state.score;document.querySelector('#energy').textContent=state.energy;
  const done=state.quest>=QUESTS.length,q=QUESTS[Math.min(state.quest,QUESTS.length-1)];
  document.querySelector('#questName').textContent=done?'所有记忆已经归位':q.name;document.querySelector('#questHint').textContent=done?'现在可以继续自由整理六条线索':q.hint;document.querySelector('#rewardText').textContent=done?'自由模式':`+${q.reward} 回忆`;
  const needsEl=document.querySelector('#questItems');needsEl.innerHTML='';
  if(!done)q.needs.forEach(n=>{const item={chain:n[0],level:n[1]},have=countNeeded(n)>0,chip=document.createElement('span');chip.className=`need-chip${have?' have':''}`;const image=itemImage(item);chip.innerHTML=`${image?`<img src="${image}" alt="">`:`<b>${chainById(n[0]).icons[n[1]]}</b>`}${itemName(item)} ${have?'✓':'· 未找到'}`;needsEl.appendChild(chip)});
  const submit=document.querySelector('#submitQuest');submit.disabled=!canSubmit();submit.textContent=done?'完成':canSubmit()?'提交':'未集齐';
  const complete=done?1:q.needs.filter(n=>countNeeded(n)>0).length/q.needs.length;document.querySelector('#questProgress').style.width=`${complete*100}%`;
  document.querySelector('#chapterTag').textContent=q.tag;document.querySelector('#chapterTitle').textContent=q.title;document.querySelector('#chapterText').textContent=q.text;document.querySelector('#storyStage').style.backgroundImage=`url('assets/backgrounds/scene-${String(q.bg).padStart(2,'0')}.webp')`;
  document.querySelector('.hero-left').src=`assets/characters/character-${String(q.left).padStart(2,'0')}.webp`;document.querySelector('.hero-right').src=`assets/characters/character-${String(q.right).padStart(2,'0')}.webp`;document.querySelector('#albumCount').textContent=`${Math.min(12,state.unlocked)} / 12`;renderAlbum();save();
}
function showToast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1700)}
function tapCell(i){
  const item=state.board[i];if(!item){state.selected=null;render();return}if(state.selected===null){state.selected=i;render();return}if(state.selected===i){state.selected=null;render();return}
  const a=state.selected,first=state.board[a];
  if(first.chain===item.chain&&first.level===item.level&&item.level<2){state.board[a]=null;state.board[i]={chain:item.chain,level:item.level+1};state.selected=null;state.merges++;state.score+=8*(item.level+1);render();boardEl.children[i].classList.add('just-merged');showToast(`合成了「${itemName(state.board[i])}」`)}else{state.selected=i;render();showToast(first.chain!==item.chain?'不同线索不能合成':'需要两个同级物件')}
}
function submitQuest(){
  if(!canSubmit())return;const q=QUESTS[state.quest];
  q.needs.forEach(n=>{const i=state.board.findIndex(x=>x&&x.chain===n[0]&&x.level===n[1]);if(i>=0)state.board[i]=null});
  state.score+=q.reward;state.quest++;state.unlocked=Math.min(12,2+state.quest*2);state.energy=Math.min(80,state.energy+8);showToast(`记忆归位，回忆 +${q.reward}，体力 +8`);render();if(state.quest>=QUESTS.length)setTimeout(()=>document.querySelector('#endingDialog').showModal(),550)
}
function source(){
  if(state.energy<1){showToast('体力不足，每 30 秒恢复 1 点');return}const empty=state.board.map((x,i)=>x===null?i:-1).filter(i=>i>=0);if(!empty.length){showToast('仓库满了，先合成或提交委托');return}
  state.energy--;const current=QUESTS[Math.min(state.quest,QUESTS.length-1)],wanted=current.needs.map(n=>n[0]);let chain;
  if(state.quest<QUESTS.length&&Math.random()<.72)chain=wanted[Math.floor(Math.random()*wanted.length)];else chain=CHAINS[Math.floor(Math.random()*CHAINS.length)].id;
  const level=Math.random()<.22?1:0,idx=empty[Math.floor(Math.random()*empty.length)];state.board[idx]={chain,level};render();boardEl.children[idx].classList.add('just-merged')
}
function shuffle(){const filled=state.board.filter(Boolean);for(let i=filled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[filled[i],filled[j]]=[filled[j],filled[i]]}state.board=[...filled,...Array(SIZE-filled.length).fill(null)];state.selected=null;render();showToast('六条线索已经重新排列')}
function resetGame(){if(!confirm('确定清空进度，从第一章重新开始吗？'))return;localStorage.removeItem('guomen-merge-v2');state={version:2,board:Array(SIZE).fill(null),score:0,energy:80,quest:0,selected:null,unlocked:2,merges:0};load();render()}
function renderAlbum(){const g=document.querySelector('#albumGrid');g.innerHTML='';PEOPLE.forEach((name,i)=>{const d=document.createElement('div');d.className='person'+(i>=state.unlocked?' locked':'');d.innerHTML=`<img src="assets/characters/character-${String(i+1).padStart(2,'0')}.webp" alt="${i<state.unlocked?name:'未解锁人物'}"><span>${i<state.unlocked?name:'等待解锁'}</span>`;g.appendChild(d)})}
boardEl.addEventListener('click',e=>{const cell=e.target.closest('.cell');if(cell)tapCell(Number(cell.dataset.i))});
document.querySelector('#sourceBtn').onclick=source;document.querySelector('#submitQuest').onclick=submitQuest;document.querySelector('#shuffleBtn').onclick=shuffle;document.querySelector('#resetBtn').onclick=resetGame;document.querySelector('#helpBtn').onclick=()=>document.querySelector('#helpDialog').showModal();document.querySelector('#albumBtn').onclick=()=>document.querySelector('#albumDialog').showModal();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelector('#continueBtn').onclick=()=>document.querySelector('#endingDialog').close();document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
const audio=document.querySelector('#bgm'),sound=document.querySelector('#soundBtn');sound.onclick=async()=>{if(audio.paused){try{await audio.play();sound.classList.add('active');sound.setAttribute('aria-label','暂停背景音乐')}catch(e){showToast('浏览器暂时无法播放音乐')}}else{audio.pause();sound.classList.remove('active');sound.setAttribute('aria-label','播放背景音乐')}};
setInterval(()=>{if(state.energy<80){state.energy++;render()}},30000);
load();render();if(!localStorage.getItem('guomen-seen-help-v2')){setTimeout(()=>document.querySelector('#helpDialog').showModal(),500);localStorage.setItem('guomen-seen-help-v2','1')}
