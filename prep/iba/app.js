
(()=> {
const D=window.IBA_DATA, $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={view:"dashboard",search:"",type:"all",chapter:"all",quiz:null};
const saved=JSON.parse(localStorage.getItem("iba_prep_state")||"{}");
const progress=saved.progress||{}, bookmarks=new Set(saved.bookmarks||[]);
function save(){localStorage.setItem("iba_prep_state",JSON.stringify({progress,bookmarks:[...bookmarks]}))}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function textOf(x){const d=document.createElement("div");d.innerHTML=x||"";return d.textContent||""}
function fmt(ms){let s=Math.max(0,Math.round(ms/1000)),h=Math.floor(s/3600);s%=3600;let m=Math.floor(s/60);s%=60;return h?`${h}h ${m}m`:`${m}m ${String(s).padStart(2,"0")}s`}
function toast(x){let t=$("#toast");t.textContent=x;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1600)}
function tests(type){return type==="all"?[]:D[type]||[]}
function qs(t){if(t.questions)return t.questions;return t.sections.flatMap(s=>s.questions||[])}
function answerQs(t){return qs(t).filter(q=>q.answers&&q.answers.length)}
function stats(t){let q=qs(t);return {all:q.length,answerable:q.filter(x=>x.answers?.length).length,passages:q.filter(x=>!x.answers?.length).length}}
function pof(t){return progress[t.id]||{attempts:0,best:0,last:0}}
function setView(v){
 state.view=v; $$(".view").forEach(x=>x.classList.remove("active")); $(`#view-${v}`).classList.add("active");
 $$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===v)); $("#crumb").textContent=v==="quiz"?"Test Session":v==="grand"?"Grand Tests":v==="mock"?"Mock Tests":v==="chapters"?"Chapter Tests":v[0].toUpperCase()+v.slice(1);
 if(v==="dashboard")dashboard(); if(v==="chapters")chapters(); if(v==="grand")library("grand"); if(v==="mock")library("mock"); if(v==="bookmarks")bookmarksView(); if(v==="progress")progressView();
 $("#sidebar").classList.remove("open")
}
function testRow(t){
 let s=stats(t),p=pof(t);
 return `<div class="row"><div class="rowLeft"><div class="icon">${t.subject==="Quantitative"?"Q":t.subject==="Verbal"?"V":"G"}</div><div style="min-width:0"><div class="rowTitle">${esc(t.name)}</div><div class="rowSub">${esc(t.subject)} · ${s.answerable} questions · ${fmt(t.totalTimeMs)}</div></div></div><div style="display:flex;align-items:center;gap:7px"><span class="tag">${p.attempts?`Best ${p.best}%`:"New"}</span><button class="btn primary" onclick="window.ibaStart('${t._type}',${t.id})">Start</button></div></div>`
}
function dashboard(){
 let recent=[...D.mock,...D.grand].slice(0,6), totalQ=D.meta.chapterQuestions+D.meta.grandQuestions+D.meta.mockQuestions;
 let attempted=Object.keys(progress).length, avg=attempted?Math.round(Object.values(progress).reduce((a,x)=>a+x.best,0)/attempted):0;
 $("#view-dashboard").innerHTML=`<div class="hero"><div><div class="eyebrow">IBA preparation</div><h1>Train with the full library.</h1><div class="sub">Chapter drills, full-length grand tests, and mock tests in one focused workspace.</div></div><div class="heroBadge">${D.meta.chapterTests+D.meta.grandTests+D.meta.mockTests} tests loaded · ${totalQ.toLocaleString()} questions</div></div>
 <div class="stats">
 <div class="stat"><div class="label">CHAPTER TESTS</div><div class="num">${D.meta.chapterTests}</div><div class="hint">${D.meta.chapters.length} chapters</div></div>
 <div class="stat"><div class="label">GRAND TESTS</div><div class="num">${D.meta.grandTests}</div><div class="hint">${D.meta.grandQuestions.toLocaleString()} questions</div></div>
 <div class="stat"><div class="label">MOCK TESTS</div><div class="num">${D.meta.mockTests}</div><div class="hint">6 Quantitative · 4 Verbal</div></div>
 <div class="stat"><div class="label">YOUR BEST AVERAGE</div><div class="num">${avg}%</div><div class="hint">${attempted} test types attempted</div></div></div>
 <div class="two"><div class="panel"><div class="panelHead"><h2>Start practicing</h2></div><div class="list">${[
 ["chapters","Chapter drills","Build topic-by-topic accuracy",D.meta.chapterTests],
 ["grand","Grand tests","Full mixed practice",D.meta.grandTests],
 ["mock","Mock tests","Focused Quant + Verbal mocks",D.meta.mockTests]].map(x=>`<div class="row"><div><div class="rowTitle">${x[1]}</div><div class="rowSub">${x[2]} · ${x[3]} available</div></div><button class="btn primary" onclick="window.ibaSetView('${x[0]}')">Open</button></div>`).join("")}</div></div>
 <div class="panel"><div class="panelHead"><h2>Recent library</h2><button class="btn ghost" onclick="window.ibaSetView('mock')">Mock tests</button></div><div class="list">${recent.map(t=>{t._type=D.mock.includes(t)?"mock":"grand";return testRow(t)}).join("")}</div></div></div>`
}
function card(t,type,i){
 let s=stats(t),p=pof(t), label=type==="chapter"?t.chapterName:t.subject;
 return `<article class="card testCard"><div class="number">${String(i+1).padStart(2,"0")}</div><h3>${esc(t.name)}</h3><p>${esc(label||"Full test")}<br>${s.answerable} answerable · ${s.passages?s.passages+" passage blocks · ":""}${fmt(t.totalTimeMs)}<br>${p.attempts?`Best ${p.best}% · ${p.attempts} attempt(s)`:"Not attempted"}</p><div class="testFoot"><span class="tag">${esc(t.subject||"Full Test")}</span><button class="btn primary" onclick="window.ibaStart('${type}',${t.id})">Start</button></div></article>`
}
function library(type){
 let arr=D[type].map(x=>({...x,_type:type}));
 let q=state.search.toLowerCase(); arr=arr.filter(t=>!q||(`${t.name} ${t.subject} ${t.chapterName}`).toLowerCase().includes(q));
 if(type==="mock"&&state.type!=="all")arr=arr.filter(t=>t.subject.toLowerCase()===state.type);
 $("#view-"+type).innerHTML=`<div class="hero"><div><div class="eyebrow">${type==="grand"?"Full-length practice":"Targeted timed practice"}</div><h1>${type==="grand"?"Grand Tests":"Mock Tests"}</h1><div class="sub">${arr.length} tests shown</div></div></div>
 <div class="toolbar">${type==="mock"?`<button class="btn ${state.type==="all"?"primary":"ghost"}" onclick="window.ibaSubject('all')">All</button><button class="btn ${state.type==="quantitative"?"primary":"ghost"}" onclick="window.ibaSubject('quantitative')">Quantitative</button><button class="btn ${state.type==="verbal"?"primary":"ghost"}" onclick="window.ibaSubject('verbal')">Verbal</button>`:""}<input class="input" value="${esc(state.search)}" placeholder="Search ${type} tests…" oninput="window.ibaLocalSearch(this.value,'${type}')"></div>
 <div class="cards">${arr.map((t,i)=>card(t,type,i)).join("")||`<div class="empty" style="grid-column:1/-1">No matching tests.</div>`}</div>`
}
function chapters(){
 let arr=D.chapter.filter(t=>!state.search||(`${t.name} ${t.subject} ${t.chapterName}`).toLowerCase().includes(state.search.toLowerCase()));
 let groups=[...new Map(D.chapter.map(t=>[`${t.subject} — ${t.chapterId} — ${t.chapterName}`,t])).values()];
 let selected=state.chapter==="all"?null:state.chapter;
 if(selected)arr=arr.filter(t=>`${t.subject} — ${t.chapterId} — ${t.chapterName}`===selected);
 $("#view-chapters").innerHTML=`<div class="hero"><div><div class="eyebrow">Topic practice</div><h1>Chapter Tests</h1><div class="sub">${arr.length} tests shown · ${groups.length} chapter groups</div></div></div>
 <div class="chapterLayout"><div class="panel chapterSide"><button class="chapterBtn ${!selected?"active":""}" onclick="window.ibaChapter('all')">All chapters <b>${D.chapter.length}</b></button>${groups.map(g=>{let k=`${g.subject} — ${g.chapterId} — ${g.chapterName}`,n=D.chapter.filter(t=>`${t.subject} — ${t.chapterId} — ${t.chapterName}`===k).length;return `<button class="chapterBtn ${selected===k?"active":""}" onclick="window.ibaChapter(${JSON.stringify(k)})">${esc(g.subject)} — ${esc(g.chapterName)} <span style="float:right">${n}</span></button>`}).join("")}</div>
 <div><div class="toolbar"><input class="input" value="${esc(state.search)}" placeholder="Search chapter tests…" oninput="window.ibaLocalSearch(this.value,'chapters')"></div><div class="cards">${arr.map((t,i)=>card(t,"chapter",i)).join("")||`<div class="empty" style="grid-column:1/-1">No matching chapter tests.</div>`}</div></div></div>`
}
function bookmarksView(){
 let items=[]; for(const type of ["chapter","grand","mock"])for(const t of D[type])for(const q of qs(t))if(bookmarks.has(String(q.id)))items.push({type,t,q});
 $("#view-bookmarks").innerHTML=`<div class="hero"><div><div class="eyebrow">Saved questions</div><h1>Bookmarks</h1><div class="sub">${items.length} saved question(s)</div></div></div>${items.length?`<div class="panel"><div class="list">${items.map(x=>`<div class="row"><div><div class="rowTitle">${esc(x.t.name)} · Q${x.q.id}</div><div class="rowSub">${esc(textOf(x.q.text)).slice(0,220)}</div></div><button class="btn ghost" onclick="window.ibaRemoveBookmark(${x.q.id})">Remove</button></div>`).join("")}</div></div>`:`<div class="empty">No bookmarks yet. Bookmark questions during a test.</div>`}`
}
function progressView(){
 let vals=Object.values(progress), attempted=vals.length, avg=attempted?Math.round(vals.reduce((a,x)=>a+x.best,0)/attempted):0;
 $("#view-progress").innerHTML=`<div class="hero"><div><div class="eyebrow">Study record</div><h1>Progress</h1><div class="sub">Stored locally in your browser.</div></div></div>
 <div class="stats"><div class="stat"><div class="label">ATTEMPTED</div><div class="num">${attempted}</div></div><div class="stat"><div class="label">TOTAL ATTEMPTS</div><div class="num">${vals.reduce((a,x)=>a+x.attempts,0)}</div></div><div class="stat"><div class="label">AVERAGE BEST</div><div class="num">${avg}%</div></div><div class="stat"><div class="label">BOOKMARKS</div><div class="num">${bookmarks.size}</div></div></div>
 <div class="panel"><div class="panelHead"><h2>History</h2><button class="btn danger" onclick="window.ibaReset()">Reset local progress</button></div><div class="list">${attempted?Object.entries(progress).map(([id,p])=>{let t=["chapter","grand","mock"].flatMap(k=>D[k]).find(t=>t.id==id);return t?`<div class="row"><div><div class="rowTitle">${esc(t.name)}</div><div class="rowSub">${esc(t.subject||"Full Test")} · ${p.attempts} attempt(s) · last ${p.last}%</div></div><div style="width:180px"><div style="display:flex;justify-content:space-between;font-size:10px"><span>Best</span><b>${p.best}%</b></div><div class="bar"><i style="width:${p.best}%"></i></div></div></div>`:""}).join(""):`<div class="empty">Start a test to begin tracking progress.</div>`}</div></div>`
}
function passageFor(q,all){
 if(!q.parentId)return null; return all.find(x=>x.id===q.parentId)||null
}
function start(type,id){
 let t=D[type].find(x=>x.id===id);if(!t)return;
 let all=qs(t), aq=all.filter(q=>q.answers?.length);
 state.quiz={type,t,all,questions:aq,index:0,answers:{},remaining:Math.max(1,Math.round(t.totalTimeMs/1000)),submitted:false,timer:null};
 setView("quiz");renderQuiz();state.quiz.timer=setInterval(()=>{if(!state.quiz||state.quiz.submitted)return;state.quiz.remaining--;updateTimer();if(state.quiz.remaining<=0)finish(true)},1000)
}
function updateTimer(){let e=$("#timer");if(!e||!state.quiz)return;let s=state.quiz.remaining,m=Math.floor(s/60);s%=60;e.textContent=`${m}:${String(s).padStart(2,"0")}`;e.classList.toggle("warn",state.quiz.remaining<300)}
function renderQuiz(){
 let z=state.quiz,q=z.questions[z.index],sel=z.answers[q.id],pass=passageFor(q,z.all),pct=Math.round(z.index/z.questions.length*100);
 $("#view-quiz").innerHTML=`<div class="quizWrap"><div class="quizTop"><div><div class="eyebrow">${esc(z.t.subject||"Full Test")} · ${esc(z.t.name)}</div><div class="sub">Question ${z.index+1} of ${z.questions.length}</div></div><div class="timer" id="timer"></div></div><div class="quizBar"><i style="width:${pct}%"></i></div>
 <div class="questionCard"><div class="qMeta">${esc(q.difficulty||"Question")} · ${esc(q.code||"")}</div>${pass?`<div class="passage"><b>Passage / source</b><div style="margin-top:7px">${pass.text}${pass.image?`<img src="${esc(pass.image)}" alt="">`:""}</div></div>`:""}<div class="question">${q.text}</div>${q.image?`<img src="${esc(q.image)}" alt="">`:""}<div class="answers">${q.answers.map((a,i)=>`<button class="answer ${sel===a.id?"selected":""}" onclick="window.ibaAnswer(${a.id})"><span class="letter">${String.fromCharCode(65+i)}</span><span>${a.text}${a.image?`<img src="${esc(a.image)}" alt="">`:""}</span></button>`).join("")}</div>
 <div class="quizActions"><button class="btn ghost" onclick="window.ibaBookmark(${q.id})">${bookmarks.has(String(q.id))?"★ Bookmarked":"☆ Bookmark"}</button><div style="display:flex;gap:8px"><button class="btn ghost" ${z.index===0?"disabled":""} onclick="window.ibaPrev()">Previous</button>${z.index<z.questions.length-1?`<button class="btn primary" onclick="window.ibaNext()">Next</button>`:`<button class="btn primary" onclick="window.ibaFinish()">Submit test</button>`}</div></div></div>
 <div class="palette">${z.questions.map((x,i)=>`<button class="pill ${i===z.index?"current":""} ${z.answers[x.id]?"done":""}" onclick="window.ibaGo(${i})">${i+1}</button>`).join("")}</div></div>`;updateTimer()
}
function answer(id){let z=state.quiz;z.answers[z.questions[z.index].id]=id;renderQuiz()}
function finish(auto=false){
 let z=state.quiz;if(!z||z.submitted)return;z.submitted=true;clearInterval(z.timer);
 let correct=0;z.questions.forEach(q=>{let a=q.answers.find(a=>a.id===z.answers[q.id]);if(a?.correct)correct++});
 let pct=Math.round(correct/z.questions.length*100),old=pof(z.t);
 progress[z.t.id]={attempts:old.attempts+1,best:Math.max(old.best,pct),last:pct,answered:Object.keys(z.answers).length};save();
 $("#view-quiz").innerHTML=`<div class="quizWrap"><div class="panel result"><div class="eyebrow">${auto?"Time expired":"Test submitted"}</div><h1>${esc(z.t.name)}</h1><div class="score">${pct}%</div><div class="sub">${correct} correct · ${z.questions.length-correct} incorrect · ${Object.keys(z.answers).length} answered</div><div style="margin-top:20px;display:flex;justify-content:center;gap:8px"><button class="btn primary" onclick="window.ibaStart('${z.type}',${z.t.id})">Retake</button><button class="btn ghost" onclick="window.ibaSetView('progress')">Progress</button></div></div>
 <div class="panel review"><div class="panelHead"><h2>Answer review</h2></div>${z.questions.map((q,i)=>{let chosen=q.answers.find(a=>a.id===z.answers[q.id]),good=chosen?.correct,ca=q.answers.find(a=>a.correct);return `<div class="reviewItem"><b>Q${i+1}</b> · ${good?'<span class="correct">Correct</span>':'<span class="wrong">Incorrect / unanswered</span>'}<div style="margin-top:5px">${q.text}</div><div class="rowSub">Correct answer: ${ca?.text||"—"}</div>${q.video?`<div style="margin-top:6px"><a href="${esc(q.video)}" target="_blank" rel="noopener" class="muted">Open solution video ↗</a></div>`:""}</div>`}).join("")}</div></div>`;
 state.quiz=null
}
window.ibaSetView=setView;window.ibaStart=start;window.ibaAnswer=answer;window.ibaNext=()=>{if(state.quiz&&state.quiz.index<state.quiz.questions.length-1){state.quiz.index++;renderQuiz()}};window.ibaPrev=()=>{if(state.quiz&&state.quiz.index>0){state.quiz.index--;renderQuiz()}};window.ibaGo=i=>{if(state.quiz){state.quiz.index=i;renderQuiz()}};window.ibaFinish=()=>finish(false);
window.ibaBookmark=id=>{let k=String(id);bookmarks.has(k)?bookmarks.delete(k):bookmarks.add(k);save();renderQuiz();toast(bookmarks.has(k)?"Bookmarked":"Bookmark removed")};
window.ibaRemoveBookmark=id=>{bookmarks.delete(String(id));save();bookmarksView();toast("Bookmark removed")};
window.ibaReset=()=>{if(confirm("Reset all saved progress and bookmarks?")){Object.keys(progress).forEach(k=>delete progress[k]);bookmarks.clear();save();progressView();toast("Reset complete")}};
window.ibaSubject=s=>{state.type=s;library("mock")};window.ibaChapter=s=>{state.chapter=s;chapters()};window.ibaLocalSearch=(s,v)=>{state.search=s;setView(v)};
$$(".nav").forEach(b=>b.onclick=()=>setView(b.dataset.view));
$("#search").oninput=e=>{state.search=e.target.value; if(state.view==="chapters")chapters(); else if(state.view==="grand")library("grand"); else if(state.view==="mock")library("mock"); else {setView("mock");}};
$("#mobileBtn").onclick=()=>$("#sidebar").classList.toggle("open");
$("#themeBtn").onclick=()=>{let d=document.documentElement.dataset.theme==="dark";document.documentElement.dataset.theme=d?"":"dark";localStorage.setItem("iba_theme",d?"light":"dark")};
if(localStorage.getItem("iba_theme")==="dark")document.documentElement.dataset.theme="dark";
dashboard();
})();
