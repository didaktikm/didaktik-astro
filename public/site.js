(function(){
/* ---------- node grid ---------- */
const c=document.getElementById('grid'),ctx=c.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,LINK=135;
let w=0,h=0,nodes=[],packets=[],pulses=[];const mouse={x:-9999,y:-9999};
function resize(){const dpr=Math.min(window.devicePixelRatio||1,2);w=c.clientWidth;h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
const n=Math.min(95,Math.floor(w*h/15000));nodes=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,agent:Math.random()<.13}));packets=[];pulses=[]}
function step(){ctx.clearRect(0,0,w,h);
for(const p of nodes){if(!reduce){
const dx=mouse.x-p.x,dy=mouse.y-p.y,dm=Math.hypot(dx,dy);
if(dm<140&&dm>1){p.x+=dx/dm*.35;p.y+=dy/dm*.35}
p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1}}
for(let i=0;i<nodes.length;i++){const a=nodes[i];
for(let j=i+1;j<nodes.length;j++){const b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);
if(d<LINK){ctx.strokeStyle='rgba(61,220,151,'+((1-d/LINK)*.40)+')';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
if(!reduce&&(a.agent||b.agent)&&Math.random()<.003)packets.push({a:a,b:b,t:0})}}
const dm=Math.hypot(a.x-mouse.x,a.y-mouse.y);
if(dm<200){ctx.strokeStyle='rgba(56,189,248,'+((1-dm/200)*.7)+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(mouse.x,mouse.y);ctx.stroke()}}
for(const p of nodes){ctx.beginPath();ctx.arc(p.x,p.y,p.agent?3:1.7,0,6.283);ctx.fillStyle=p.agent?'#38bdf8':'rgba(61,220,151,.9)';
ctx.shadowColor=p.agent?'#38bdf8':'#3ddc97';ctx.shadowBlur=p.agent?16:6;ctx.fill();ctx.shadowBlur=0}
packets=packets.filter(k=>(k.t+=0.022)<1);
for(const k of packets){const x=k.a.x+(k.b.x-k.a.x)*k.t,y=k.a.y+(k.b.y-k.a.y)*k.t;ctx.fillStyle='#e6fff4';ctx.shadowColor='#3ddc97';ctx.shadowBlur=12;ctx.fillRect(x-2,y-2,4,4);ctx.shadowBlur=0}
pulses=pulses.filter(p=>(p.r+=3.2)<p.max);
for(const p of pulses){ctx.strokeStyle='rgba(56,189,248,'+(1-p.r/p.max)*.6+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.stroke()}}
function loop(){if(!document.hidden)step();requestAnimationFrame(loop)}
function pulseAt(x,y){let best=null,bd=1e9;for(const n of nodes){const d=Math.hypot(n.x-x,n.y-y);if(d<bd){bd=d;best=n}}
pulses.push({x:x,y:y,r:4,max:150});if(!best)return;
for(const n of nodes){if(n!==best&&Math.hypot(n.x-best.x,n.y-best.y)<LINK*1.4)packets.push({a:best,b:n,t:0})}}
addEventListener('resize',resize);addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});
document.addEventListener('pointerdown',e=>{if(reduce)return;if(e.target.closest('input,a,button,.term,article'))return;pulseAt(e.clientX,e.clientY)});
resize();if(reduce)step();else loop();

/* ---------- terminal ---------- */
const out=document.getElementById('out'),form=document.getElementById('f'),input=document.getElementById('in'),root=document.getElementById('term'),chips=document.getElementById('chips');
const hist=[];let hi=0,busy=false;
const print=(t='',cls='')=>{const d=document.createElement('div');d.className='ln '+cls;d.textContent=t;out.appendChild(d);out.scrollTop=out.scrollHeight};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const play=async(lines,ms=380)=>{for(const [t,cl] of lines){print(t,cl);await sleep(ms)}};
const A=(...x)=>x; /* helper for arrays */

const files={
'about.txt':['DevOps-архитектор. Платформы, автоматизация и локальные ИИ-инструменты.','Контейнеры, прокси, мониторинг и агенты.'],
'stack.txt':['docker  compose  caddy','linux   bash     python','llm     agents   mcp'],
'contact.txt':['hello@didaktik.dev'],
'.env':['SECRET_KEY=hunter2','DB_PASSWORD=password123','(это шутка, здесь ничего нет)'],
'runbook.md':['1. Не паниковать.','2. Проверить DNS.','3. Это был DNS.','4. Написать постмортем.']
};
const fortunes=[
'Бэкап, который не проверяли на восстановление, это не бэкап, а надежда.',
'В пятницу вечером выкатывают только те, кто не боится выходных.',
'Если работает, не трогай. Если не работает, не трогай в пятницу.',
'Любая достаточно сложная инфраструктура содержит скрипт, который никто не помнит, но все боятся удалить.',
'«Временное решение» это самое долгоживущее решение в проде.',
'Мониторинг молчит. Либо всё хорошо, либо мониторинг тоже упал.',
'Документация актуальна ровно до первого коммита после её написания.',
'Сертификат истекает в самый неудобный момент. Это закон природы.'
];
const causes=[
'Root cause: DNS. Всегда DNS.',
'Root cause: сертификат истёк вчера в 03:12.',
'Root cause: в YAML лишний пробел на 412-й строке.',
'Root cause: кто-то «быстро поправил руками» в проде.',
'Root cause: часовые пояса. Конечно же часовые пояса.',
'Root cause: диск заполнился логами, которые логировали сами себя.',
'Root cause: cron, написанный в 2017 году, наконец сработал.',
'Root cause: «это же временный костыль».'
];
const cow=t=>{const l='-'.repeat(t.length+2);return[' '+l,'< '+t+' >',' '+l,'        \\   ^__^','         \\  (oo)\\_______','            (__)\\       )\\/\\','                ||----w |','                ||     ||']};
const clear=()=>{out.textContent=''};
const isFri=()=>new Date().getDay()===5;

const cmds={
help:()=>['Система:   ls  cat <file>  pwd  whoami  id  uname  date  uptime  df  free  top  ps  env  history  clear','Контейнеры: docker ps|logs|build|run|images|compose|exec|pull  kubectl get|describe|logs|rollout|apply|scale|delete|top  helm  systemctl status','Сеть:      ping  curl  dig  traceroute  ssh  nmap  netstat  lsof  iptables -F  certbot','Git/CI:    git status|log|blame|push --force  deploy  rollback  make  npm install  jenkins  argocd','Infra:     terraform plan|apply|destroy  ansible  crontab  tail -f  kill -9  chmod 777  journalctl  reboot  caddy','Облако:    aws  cost  backup  grep password','Агенты:    agents  neofetch  slo  incident  oncall  standup  ai','Веселье:   fortune  cowsay <текст>  coffee  vim  man  yes  sudo  rm -rf /  works','Подсказки: Tab дополняет, стрелки листают историю, клик по фону запускает пульс сети.'],
whoami:()=>['guest'],
id:()=>['uid=1000(guest) gid=1000(guest) groups=1000(guest),0(иллюзия_контроля)'],
pwd:()=>['/home/guest'],
uname:()=>['Linux didaktik 6.x-didactic #1 SMP PREEMPT (it works, do not ask how)'],
ls:()=>Object.keys(files).concat('notes/ (soon)'),
cat:([f])=>(f&&files[f])||[f?('cat: '+f+': No such file or directory'):'cat: missing file'],
cd:()=>['cd: здесь везде /home/guest, идти некуда'],
stack:()=>files['stack.txt'],
date:()=>[new Date().toString()],
uptime:()=>['up 99.9%  (и это не шутка, это SLO)','load average: 0.42, 0.37, 0.30  (подозрительно спокойно)'],
df:()=>['Filesystem      Size  Used Avail Use% Mounted on','/dev/sda1        40G   31G  7.2G  82% /','/dev/sdb1       200G  200G     0 100% /var/log','tmpfs           1.0G     0  1.0G   0% /dev/shm','Подсказка: /var/log, как обычно.'],
free:()=>['              total   used   free  shared  buff/cache','Mem:           1993   412    64      12     1517','Linux съел всю свободную память под кеш. Это нормально.'],
top:()=>['PID   %CPU %MEM COMMAND','4242  97.3  8.1 node (1 of 47 helper processes)','1337  41.0  3.2 java -Xmx8g -jar hello-world.jar','  17   0.3  0.1 caddy','   1   0.0  0.0 systemd','Load высокий, но виноват не я.'],
ps:()=>['USER   PID COMMAND','guest    1 /bin/sh','guest   42 that_script_nobody_remembers.sh','root   666 cron  (опять он)'],
env:()=>['SHELL=/bin/fake-zsh','USER=guest','EDITOR=vim  (выход пока не найден)','SECRET_KEY=********  (звёздочки настоящие)','TZ=UTC  (единственная правильная)'],
history:()=>hist.length?hist.map((x,i)=>(i+1)+'  '+x):['(пусто, как после git clean -fdx)'],
echo:a=>[a.join(' ')],
clear:()=>{clear()},
exit:()=>['Некуда. Вы уже в проде.'],
42:()=>['Ответ найден. Вопрос потерян при миграции.'],
status:()=>['all systems nominal (по версии дашборда, который никто не открывал)'],
fortune:()=>[pick(fortunes)],
cowsay:a=>cow(a.join(' ')||'работает на моей машине'),
coffee:()=>['    ( (','     ) )','  ........','  |      |]','  \\      /',"   `----'",'HTTP 418: я чайник, но кофе сварил.'],
works:()=>['Работает на моей машине.','Тогда отправляем машину в продакшен.'],
slo:()=>['SLO 99.9% = 43 мин 49 сек простоя в месяц.','Бюджет ошибок потрачен на одну выкатку в пятницу.'],
vim:()=>['~','~','~','-- INSERT --','Вы в vim. Выход: Esc, затем :q! (но это не точно).'],
nano:()=>['GNU nano 7.2    New Buffer','^X Exit   (да, тут всё написано, это же nano)'],
emacs:()=>['Загрузка... ещё загрузка... это операционная система, а не редактор.'],
make:([t])=>t==='coffee'?cmds.coffee():['make: *** No targets specified and no makefile found.  Stop.'],
man:([t])=>['No manual entry for '+(t||'anything'),'Попробуйте: прочитать исходники (их нет).'],
chmod:(a,raw)=>/777/.test(raw)?['chmod: служба безопасности уже в курсе.']:['chmod: ok'],
crontab:()=>['*/5 * * * * /opt/scripts/fix_it_again.sh','0 3 * * 1 /opt/scripts/dont_touch_me.sh','# автор обоих скриптов давно уволился'],
kill:(a,raw)=>/-9/.test(raw)?['Killed. (без шансов на graceful shutdown)']:['kill: usage: kill -9 <pid>, но сначала подумайте'],
sudo:(a,raw)=>/sandwich/.test(raw)?['Okay.']:/rm\s+-\w*r\w*f|rm\s+-\w*f\w*r/.test(raw)?cmds.rm(a,raw):['guest is not in the sudoers file. This incident will be reported.'],
npm:(a)=>a[0]==='install'||a[0]==='i'?cmds._npm():['npm: попробуйте npm install, всё равно ничего другого вы не сделаете'],
_npm:async()=>{await play([['resolving 1,847 packages ...',''],['left-pad ✓  is-odd ✓  is-even ✓','ok']],500);return['added 1,847 packages, audited 1,848 packages in 41s','1 critical vulnerability  (там всегда одна)','node_modules весит больше, чем весь ваш проект.']},
yes:async()=>{await play([['y',''],['y',''],['y',''],['y',''],['y','']],140);return['(остановлено здравым смыслом)']},
ping:async(a)=>{const h=a[0]||'didaktik.dev';await play([['PING '+h+': 56 bytes',''],['reply: time=0.4 ms','ok'],['reply: time=0.4 ms','ok'],['reply: time=0.3 ms','ok']],280);return['0% потерь. Пока не пятница.']},
traceroute:async(a)=>{await play([['1  gateway           0.4 ms',''],['2  isp-edge          3.1 ms',''],['3  * * *','warn'],['4  * * *','warn'],['5  ???               (file a ticket)','bad'],['6  '+(a[0]||'didaktik.dev')+'  12.7 ms','ok']],360);return[]},
dig:()=>['; <<>> DiG <<>> it-is-always.dns','status: NOERROR','ANSWER: it IS the DNS.'],
curl:(a,raw)=>/localhost|127\.0|health/.test(raw)?['HTTP/1.1 200 OK','{"status":"ok"}  (нагло врёт)']:['HTTP/1.1 418 I\'m a teapot','Попробуйте curl localhost/health, там тоже всё врут.'],
ssh:(a)=>['ssh: connect to host '+(a[a.length-1]||'prod')+' port 22: Connection timed out','(firewall, VPN или Меркурий в ретрограде)'],
docker:async(a)=>{
if(a[0]==='ps')return['CONTAINER     IMAGE            STATUS                  NAMES','a1b2c3d4e5f6  caddy:2-alpine   Up 41 days              proxy','9f8e7d6c5b4a  postgres:16      Up 41 days (healthy)    db','0c1d2e3f4a5b  agent:latest     Restarting (1) 3 sec    agent-reviewer','7a6b5c4d3e2f  nginx:latest     Exited (0) 2 yrs ago    do-not-delete'];
if(a[0]==='logs'){await play([['[info]  starting...',''],['[info]  ready',''],['[warn]  deprecated, will be removed in v2 (в 2019 году)','warn'],['[error] connection refused: db:5432','bad'],['[info]  retrying in 1s ... (бесконечно)','']],320);return[]}
if(a[0]==='system'&&a[1]==='prune')return['Deleted 214 objects. Reclaimed 38GB.','И один контейнер, который был нужен.'];
if(a[0]==='build'){await play([['Sending build context to Docker daemon  4.2GB','warn'],['Step 1/9 : FROM ubuntu:latest',''],['Step 4/9 : RUN apt-get install everything','warn'],['Step 7/9 : COPY . .  (вместе с node_modules и .git)','warn']],420);return['Successfully built 3f2a1b9c. Размер образа: 4.7GB. Для статического сайта.','.dockerignore существует. Серьёзно.']}
if(a[0]==='run')return['docker: Error response from daemon: port is already allocated.','Порт занял кто-то, кто очень хотел быть первым. Скорее всего, вы же, три дня назад.'];
if(a[0]==='images')return['REPOSITORY   TAG      SIZE','app          latest   4.7GB','app          latest2  4.7GB','<none>       <none>   4.7GB   (призраки прошлых релизов)'];
if(a[0]==='compose')return['[+] Running 3/4',' ✔ Container db     Healthy',' ✔ Container proxy  Started',' ✘ Container app    Exited (1)','app | Error: cannot connect to db','db: «у меня всё хорошо». Healthcheck проверяет только то, что процесс жив.'];
if(a[0]==='exec')return['OCI runtime exec failed: executable file not found in $PATH','В alpine нет bash. И не будет. Используйте sh и смиритесь.'];
if(a[0]==='pull')return['toomanyrequests: You have reached your pull rate limit.','Подождите час. Или заплатите. Или соберите всё сами, как в 2005.'];
return['docker: попробуйте docker ps, logs, build, run, images, compose, exec, pull или system prune'];},
kubectl:(a)=>{
if(a[0]==='get'&&/pods?/.test(a[1]||''))return['NAME            READY  STATUS            RESTARTS  AGE','api-7d9f8       1/1    Running           0         12d','worker-5c4b2    0/1    CrashLoopBackOff  47        3h','agent-6f1a0     1/1    Running           3         2d','legacy-0        0/1    Pending           0         2y'];
if(a[0]==='get'&&/nodes?/.test(a[1]||''))return['NAME     STATUS     ROLES    AGE','node-1   Ready      worker   400d','node-2   NotReady   worker   400d   (никто не смотрел)','node-3   Ready      control  400d   (единственный, кто работает)'];
if(a[0]==='describe')return['Events:','  Warning  FailedScheduling  0/3 nodes are available: 3 Insufficient cpu.','  Warning  BackOff           Back-off restarting failed container','Если коротко: кластер вас не любит. Подробности на 4000 строк YAML.'];
if(a[0]==='logs')return['Error from server (BadRequest): container is waiting to start: CrashLoopBackOff','Логов не будет. Контейнер умер, не оставив записки.'];
if(a[0]==='rollout')return['deployment.apps/api restarted','Хорошая новость: перезапустилось. Плохая: проблема тоже перезапустилась.'];
if(a[0]==='delete')return['Error from server (Forbidden): namespaces production is forbidden','Спасибо, RBAC. Вы только что избежали резюме с пометкой «удалил прод».'];
if(a[0]==='apply')return['deployment.apps/api configured','service/api unchanged','configmap/app-config configured  (и теперь всё сломано по-новому)'];
if(a[0]==='scale')return['deployment.apps/api scaled to 0','Поздравляем: нулевой даунтайм заменён нулевым аптаймом.'];
if(a[0]==='top')return['NAME          CPU     MEMORY','api-7d9f8     12m     9800Mi   (утечка памяти это фича)','worker-5c4b2  1998m   64Mi     (работает за двоих и ненавидит всех)'];
return['The connection to the server localhost:8080 was refused - did you specify the right host or port?'];},
systemctl:(a)=>a[0]==='status'?['● caddy.service - Caddy','   Active: active (running) since Mon, 41 days ago','● friday-deploy.service','   Active: failed (Result: exit-code)  (по пятницам оно всегда failed)']:['Failed to connect to bus: Нет такой магии.'],
git:async(a)=>{
const s=a[0];
if(s==='status')return['On branch main','Changes not staged for commit:','        modified:   everything.yaml','Untracked files:','        final_FINAL_v3_real.yaml'];
if(s==='log')return['commit a1b2c3d  fix','commit 9e8d7c6  fix fix','commit 5f4e3d2  please work','commit 1a2b3c4  initial commit (это был хороший день)'];
if(s==='blame')return['a1b2c3d (guest  2023-03-14) // TODO: убрать до релиза','a1b2c3d (guest  2023-03-14) // не трогать'];
if(s==='push'&&/force|-f/.test(a.join(' ')))return['! [remote rejected] main -> main (protected branch)','Вовремя защитили. Выдохните.'];
if(s==='commit')return['[main f00ba12] wip','1 file changed, 4821 insertions(+)  (это был не wip)'];
return['git: попробуйте status, log, blame, commit или push --force'];},
deploy:async()=>{await play([['build   ✓','ok'],['test    ✓  (3 skipped)','ok'],['push    ✓','ok']],350);return[isFri()?'production: ОТКАЗАНО. Сегодня пятница.':'production: выкачено. Следите за дашбордом.']},
rollback:async()=>{await play([['revert to v1.8.3 ...','warn'],['revert to v0.0.1 ...','warn']],420);return['Откатились до «initial commit». Продукт снова стабилен (он ничего не умеет).']},
terraform:async(a)=>{
if(a[0]==='plan'){return['Plan: 1 to add, 0 to change, 47 to destroy.','47 to destroy? Хм, это точно то, что мы хотели?']}
if(a[0]==='apply'){await play([['aws_instance.prod: Modifying...',''],['aws_instance.prod: Still modifying... [10m]','warn']],600);return['Apply complete (почти). State lock никто не освободит.']}
if(a[0]==='destroy')return['Error: this is not a drill.','Terraform отказывается: он знает вас лучше, чем вы себя.'];
return['terraform: попробуйте plan, apply или destroy (последнее на свой страх)'];},
ansible:()=>['PLAY [all] ****','ok: [prod]','changed=0  ok=1  failed=0','Идемпотентно, как и обещали (ничего не изменилось и это пугает).'],
'tail':async(a)=>{await play([['GET /health 200 3ms',''],['GET /api/v1/users 200 41ms',''],['POST /login 500 1204ms','bad'],['GET /health 200 2ms',''],['WARN: кто-то опять запустил cron в прод','warn']],330);return['(Ctrl+C. шутка, всё остановилось само)']},
incident:async()=>{await play([['Генерируем постмортем ...',''],['Impact: пользователи недовольны, коллеги тоже','warn']],500);return[pick(causes),'Action items: добавить мониторинг, обновить runbook, никому не говорить.']},
oncall:async()=>{await play([['PagerDuty: 03:12  CRITICAL  disk usage > 99%','bad'],['Вы: ack','ok'],['PagerDuty: 03:13  RESOLVED  (само)','ok']],520);return['Это был /var/log. Это всегда /var/log.']},
neofetch:()=>['guest@didaktik','--------------','OS:     didaktik.dev','Shell:  fake-zsh 0.2','Agents: 3 running, 1 reviewing','Uptime: since the last incident','Bugs:   фичи, не прошедшие ревью'],
agents:async()=>{await play([['spawn planner      ...',''],['spawn researcher   ...',''],['spawn reviewer     ...',''],['planner     -> researcher: need sources','ok'],['researcher  -> reviewer:   draft ready','ok'],['reviewer    -> planner:    rejected (nitpicks)','warn']],420);return['Агенты вошли в бесконечный цикл ревью. Это нормально.']},
hire:()=>['hello@didaktik.dev','Доступен для интересных задач. Скучных у нас и так хватает.'],
contact:()=>cmds.hire(),
helm:(a)=>a[0]==='install'||a[0]==='upgrade'?['Error: UPGRADE FAILED: another operation (install/upgrade/rollback) is in progress','Релиз завис в pending-upgrade. Лечится так: helm rollback, молитва или ручное удаление секрета релиза (в проде, конечно).']:['helm: попробуйте helm upgrade и заварите чай'],
aws:()=>['An error occurred (AccessDenied) when calling the Everything operation:','User guest is not authorized to perform: быть счастливым','Зато IAM-политика на 4000 строк написана с любовью.'],
cost:()=>['Cloud bill (текущий месяц): $48,213.07','Топ расходов: GPU-инстанс, забытый в 2022, NAT Gateway и «временный» бакет.','Экономия достигается выключением. Но выключать страшно: вдруг это кто-то использует.'],
iptables:(a,raw)=>/-F|flush/i.test(raw)?['iptables: правила сброшены.','Connection to prod closed by remote host.','Ваш SSH-доступ тоже был правилом. Звоните провайдеру, ищите KVM-консоль.']:['iptables: попробуйте iptables -F (в этом терминале безопасно, на проде это резюме)'],
grep:(a,raw)=>/password|secret|token|key/i.test(raw)?['config.yaml:12:  password: admin','.env.backup:3:  TOKEN=abc123  (закоммичен в 2021)','deploy.sh:7:  # TODO: убрать пароль из скрипта','Найдено 3 секрета. Нет, не утекли. Пока что.']:['grep: ничего не найдено (подозрительно)'],
lsof:()=>['COMMAND  PID   USER   NAME','node     4242  guest  TCP *:3000 (LISTEN)   dev-сервер с прошлого вторника','java     1337  guest  TCP *:8080 (LISTEN)   вот кто занял ваш порт'],
netstat:()=>cmds.lsof(),
journalctl:()=>['-- Logs begin at Mon 2019-03-04 --','Oct 15 03:12:01 prod systemd[1]: Started nightly-miracle.service.','Oct 15 03:12:02 prod app[777]: panic: not implemented  (но как-то же работало)','Oct 15 03:12:03 prod kernel: Out of memory: Killed process 777 (app)','Вердикт: OOM killer снова принял за вас сложное решение.'],
certbot:()=>['Certificate expires in 2 days.','Renewal failed: порт 80 занят прокси, который вы настроили полгода назад.','Это не баг. Это сюрприз с датой.'],
nmap:()=>['Nmap scan report for prod (10.0.0.5)','22/tcp    open  ssh    (пароль: root)','3306/tcp  open  mysql  (наружу, как и задумано)','6379/tcp  open  redis  (без пароля, ведь так проще)','Это не отчёт сканера. Это описание вашей инфраструктуры.'],
reboot:()=>['Connection to prod closed by remote host.','Аптайм 412 дней сброшен. Теперь выясняем, что из этого жило только в памяти.'],
shutdown:()=>cmds.reboot(),
argocd:()=>['application api: OutOfSync / Degraded','Sync: Syncing... Syncing... Syncing...','GitOps это когда зависаешь декларативно.'],
jenkins:()=>['Started by timer','[Pipeline] stage (Build)  FAILED','Билд зелёный в 1 из 11 запусков. Нажимайте rebuild, пока не повезёт. Это называется «флаки-тесты».'],
standup:()=>['Вчера: чинил то, что сломал позавчера.','Сегодня: чиню то, что сломал вчера.','Блокеры: хочу в отпуск.'],
ai:()=>['Агент уверенно сгенерировал команду с флагом, которого не существует.','Агент уверенно извинился. Дважды.','Агент уверенно сгенерировал ещё одну. Её вы почти запустили.'],
caddy:(a)=>a[0]==='validate'?['Valid configuration','(синтаксис верный, смысл не проверялся)']:['caddy: попробуйте caddy validate'],
backup:()=>['Последний бэкап: 14 месяцев назад','Проверка восстановления: не проводилась','Статус: надежда.'],
rm:async(a,raw)=>{if(!/-\w*r\w*f|-\w*f\w*r/.test(raw))return['rm: missing operand'];await play([['removing /usr ...','warn'],['removing /var ...','warn'],['removing /home ...','warn']],450);return['Шучу. Файловая система read-only, бэкапы в трёх местах (проверены).']}
};
/* fork bomb easter egg */
async function run(raw){print('$ '+raw,'cmd');
if(/:\(\)\s*\{/.test(raw)){print('bash: fork: retry: Resource temporarily unavailable','bad');print('ulimit -u спас вас от позора.','warn');return}
const parts=raw.trim().split(/\s+/),name=parts[0],args=parts.slice(1);if(!name)return;
const key=name.toLowerCase();
const fn=(Object.prototype.hasOwnProperty.call(cmds,key)&&!key.startsWith('_'))?cmds[key]:null;
if(!fn){print(name+': command not found','bad');print(pick(['Спрашиваю агента... агент ушёл рефакторить.','Это точно было в README (нет).','Попробуйте перезагрузить. Нет, не сервер, а себя.','man '+name+': No manual entry. Try turning it off and on again.']),'warn');return}
busy=true;try{const res=await fn(args,raw);if(Array.isArray(res))res.forEach(l=>print(l))}finally{busy=false}}

form.addEventListener('submit',e=>{e.preventDefault();if(busy)return;const v=input.value;input.value='';if(v.trim()){hist.push(v);hi=hist.length}run(v)});
input.addEventListener('keydown',e=>{
if(e.key==='ArrowUp'){e.preventDefault();hi=Math.max(0,hi-1);input.value=hist[hi]||''}
else if(e.key==='ArrowDown'){e.preventDefault();hi=Math.min(hist.length,hi+1);input.value=hist[hi]||''}
else if(e.key==='Tab'){e.preventDefault();const v=input.value.toLowerCase();const m=Object.keys(cmds).filter(x=>!x.startsWith('_')&&x.startsWith(v));if(m.length===1)input.value=m[0]+' ';else if(m.length>1&&v){print('$ '+input.value,'cmd');print(m.join('  '),'info')}}
else if(e.ctrlKey&&e.key.toLowerCase()==='l'){e.preventDefault();clear()}
else if(e.ctrlKey&&e.key.toLowerCase()==='c'){e.preventDefault();input.value='';print('^C','warn')}});
root.addEventListener('click',()=>input.focus());

['docker ps','kubectl get pods','docker build .','helm upgrade','kubectl delete','git blame','terraform destroy','iptables -F','cost','backup','incident','oncall','fortune','help'].forEach(t=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.addEventListener('click',()=>{if(busy)return;hist.push(t);hi=hist.length;run(t)});chips.appendChild(b)});
print('didaktik shell 0.2. Введите "help" или нажмите на подсказку ниже.','ok');
})();
