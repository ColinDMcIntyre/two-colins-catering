function buildCalendar(){
  const calendar=document.getElementById('calendar');
  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  days.forEach(d=>{
    const div=document.createElement('div');
    div.textContent=d;
    div.classList.add('day','unavailable');
    calendar.appendChild(div);
  });
  for(let i=1;i<=30;i++){
    const date=new Date();
    date.setDate(i);
    const div=document.createElement('div');
    div.textContent=i;
    div.classList.add('day');
    if(date.getDay()===0||date.getDay()===6){
      div.classList.add('available');
    } else {
      div.classList.add('unavailable');
    }
    calendar.appendChild(div);
  }
}
function calcCost(){
  const start=document.getElementById('startTime').value;
  const end=document.getElementById('endTime').value;
  const helpers=parseInt(document.getElementById('helpers').value);
  if(!start||!end)return;
  const hours=(new Date(`1970-01-01T${end}:00`)-new Date(`1970-01-01T${start}:00`))/3600000;
  let base=200*helpers;
  let extra=0;
  if(hours>3){ extra=(hours-3)*30*helpers; }
  document.getElementById('cost').textContent=`Estimated Cost: $${base+extra}`;
}
document.getElementById('startTime').addEventListener('change',calcCost);
document.getElementById('endTime').addEventListener('change',calcCost);
document.getElementById('helpers').addEventListener('change',calcCost);
buildCalendar();