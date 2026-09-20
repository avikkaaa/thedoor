const door=document.getElementById('doorVisual'),statusText=document.getElementById('statusText'),note=document.getElementById('systemNote'),toast=document.getElementById('toast'),toastText=document.getElementById('toastText'),openCount=document.getElementById('openCount');
let isOpen=false,isLocked=true,count=17,toastTimer;
function showToast(msg){toastText.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2800)}
function render(){door.classList.toggle('open',isOpen);door.classList.toggle('locked',isLocked);statusText.textContent=(isOpen?'OPEN':'CLOSED')+' · '+(isLocked?'LOCKED':'UNLOCKED')}
document.getElementById('openBtn').onclick=()=>{if(isLocked){showToast('Opening denied. The door is locked, as doors occasionally are.');return}isOpen=true;count++;openCount.textContent=count;note.textContent='Door opened successfully. Civilization continues.';showToast('Door opened with enterprise-grade confidence.');render()}
document.getElementById('closeBtn').onclick=()=>{isOpen=false;note.textContent='Door closed. A highly complex operation is now complete.';showToast('Your door is closed again.');render()}
document.getElementById('lockBtn').onclick=()=>{if(isOpen){showToast('Locking an open door would be ambitious. Close it first.');return}isLocked=true;note.textContent='Security posture upgraded: door locked.';showToast('Door secured. Threat level remains: door.');render()}
document.getElementById('unlockBtn').onclick=()=>{isLocked=false;note.textContent='Door unlocked. Access to the other side is now technically possible.';showToast('Door unlocked. Revolutionary.');render()}
document.getElementById('finalOpen').onclick=()=>{isLocked=false;isOpen=true;count++;openCount.textContent=count;render();showToast('You opened the door. This is what the entire product was for.');window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.chips').forEach(group=>group.querySelectorAll('.chip').forEach(chip=>chip.onclick=()=>{group.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');const id=group.dataset.group+'Value';document.getElementById(id).textContent=chip.textContent.toUpperCase()}))
const speed=document.getElementById('speedRange'),speedValue=document.getElementById('speedValue');speed.oninput=()=>{const v=+speed.value;speedValue.textContent=v<25?'CEREMONIALLY SLOW':v<50?'CAUTIOUS':v<75?'RESPONSIBLY FAST':'RIDICULOUSLY FAST'}
document.getElementById('saveConfig').onclick=()=>showToast('Perfect door configuration saved. Humanity may proceed.')
document.querySelectorAll('#incidentGrid button').forEach(btn=>btn.onclick=()=>{document.getElementById('emergencyResponse').innerHTML='<span>INCIDENT RESPONSE · COMPLETE</span><p>'+btn.dataset.response+'</p>';showToast(btn.dataset.response)})
const insights=[
'“You opened your door 23% more frequently today. Statistical models suggest you may open it again.”',
'“Your door has remained closed for several minutes. This strongly correlates with not being open.”',
'“Recommendation: consider closing your door after opening it to restore the closed state.”',
'“Hinge activity is 14% above baseline. No action is required, but we wanted you to know.”',
'“Predictive model confidence: 87% chance this door will continue being a door tomorrow.”'
];let insightIndex=0;document.getElementById('newInsight').onclick=()=>{insightIndex=(insightIndex+1)%insights.length;document.getElementById('aiInsight').textContent=insights[insightIndex]}
document.getElementById('themeButton').onclick=()=>{document.documentElement.classList.toggle('light')}
render();
