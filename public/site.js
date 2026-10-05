(function(){
var d=document,h=d.documentElement;
function g(k){try{return localStorage.getItem(k)}catch(e){return null}}
function s(k,v){try{localStorage.setItem(k,v)}catch(e){}}
h.classList.add('js');
var red=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* Dark mode */
var tb=d.getElementById('theme');
function theme(t){h.setAttribute('data-theme',t);s('theme',t);if(tb)tb.textContent=t==='dark'?'Light':'Dark'}
theme(g('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
if(tb)tb.addEventListener('click',function(){theme(h.getAttribute('data-theme')==='dark'?'light':'dark')});

/* Mobile menu */
var mb=d.querySelector('.menu-btn'),nv=d.getElementById('nav');
if(mb)mb.addEventListener('click',function(){mb.setAttribute('aria-expanded',nv.classList.toggle('open'))});

/* Analytics (only after Accept). Put your Google Analytics ID here, e.g. 'G-XXXXXXXXXX' */
var GA_ID='';
function ga(){if(!GA_ID)return;var x=d.createElement('script');x.async=1;x.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;d.head.appendChild(x);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',GA_ID,{anonymize_ip:true})}

/* Cookie notice */
var ck=g('cookie');
if(ck==='yes')ga();
if(!ck){var b=d.createElement('div');b.className='cookie';b.setAttribute('role','dialog');b.setAttribute('aria-label','Cookies');
b.innerHTML='<span>This site uses cookies for analytics.</span> <a href="privacy.html">Privacy</a> <button class="btn sign" data-c="yes" type="button">Accept</button> <button class="btn" data-c="no" type="button">Decline</button>';
d.body.appendChild(b);
b.addEventListener('click',function(e){var v=e.target.getAttribute&&e.target.getAttribute('data-c');if(v){s('cookie',v);b.remove();if(v==='yes')ga()}})}

/* Language switcher (English / Urdu). Add more pairs here to translate more text. */
var UR={'About':'ہمارے بارے میں','Programs':'پروگرامز','Admission':'داخلہ','Contact':'رابطہ','Menu':'مینو','Privacy':'پرائیویسی','Media':'میڈیا','Main building':'مرکزی عمارت','Eligibility':'اہلیت','Civil Technology':'سول ٹیکنالوجی','Computer Information Technology':'کمپیوٹر انفارمیشن ٹیکنالوجی','Textile Technology':'ٹیکسٹائل ٹیکنالوجی','Login':'لاگ ان','Dashboard':'ڈیش بورڈ','Log in':'لاگ ان کریں','Log out':'لاگ آؤٹ','Password':'پاس ورڈ','Create an account':'اکاؤنٹ بنائیں','Create account':'اکاؤنٹ بنائیں',
'Government College of Technology, Kamalia':'گورنمنٹ کالج آف ٹیکنالوجی، کمالیہ','About the college':'کالج کے بارے میں','Who we are':'ہم کون ہیں','Principal':'پرنسپل',
'Departments':'شعبہ جات','Chemical Technology':'کیمیکل ٹیکنالوجی','Before you apply':'درخواست دینے سے پہلے','Admission office':'داخلہ آفس',
'Contact details':'رابطے کی تفصیلات','Finding us':'ہم تک کیسے پہنچیں','Admission details':'داخلے کی تفصیلات','Go to admission':'داخلے کے صفحے پر جائیں',
'Call admission office':'داخلہ آفس کو کال کریں','Email the college':'کالج کو ای میل کریں','Open in Google Maps':'گوگل میپس میں کھولیں','Get directions':'راستہ دیکھیں',
'Send an inquiry':'انکوائری بھیجیں','Send inquiry by email':'ای میل کے ذریعے انکوائری بھیجیں','Full name':'پورا نام','Phone number':'فون نمبر','Address':'پتہ','Phone':'فون','Landline':'لینڈ لائن','Email':'ای میل',
'Gallery':'گیلری','Reviews':'تبصرے','Write a review':'تبصرہ لکھیں','Your review':'آپ کا تبصرہ','Rating':'ریٹنگ','Post review':'تبصرہ بھیجیں','Not sure yet':'ابھی معلوم نہیں',
'Campus':'کیمپس','Labs':'لیبارٹریز','Classrooms':'کلاس رومز','Events':'تقریبات','Video':'ویڈیو','Audio':'آڈیو','Social media':'سوشل میڈیا',
'This site uses cookies for analytics.':'یہ ویب سائٹ اینالیٹکس کے لیے کوکیز استعمال کرتی ہے۔','Accept':'قبول کریں','Decline':'مسترد کریں'};
var lb=d.getElementById('lang');
function lang(l){h.lang=l;h.dir=l==='ur'?'rtl':'ltr';s('lang',l);
d.querySelectorAll('a,h1,h2,h3,p,dt,label,button,small,figcaption,option,span').forEach(function(e){
if(e.children.length||e.hasAttribute('data-nolang'))return;
var t=e.getAttribute('data-en')||e.textContent.trim();
if(UR[t]){e.setAttribute('data-en',t);e.textContent=l==='ur'?UR[t]:t}});
if(lb)lb.textContent=l==='ur'?'English':'اردو'}
lang(g('lang')==='ur'?'ur':'en');
if(lb)lb.addEventListener('click',function(){lang(h.lang==='ur'?'en':'ur')});

/* Scroll reveal */
if(!red&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
d.querySelectorAll('main section').forEach(function(x){x.classList.add('reveal');io.observe(x)})}

/* Image carousel */
var cr=d.querySelector('.carousel');
if(cr){var sl=cr.querySelectorAll('.slide'),i=0,t;
var go=function(n){sl[i].classList.remove('on');i=(n+sl.length)%sl.length;sl[i].classList.add('on')};
var play=function(){if(!red)t=setInterval(function(){go(i+1)},5000)},stop=function(){clearInterval(t)};
cr.querySelector('.prev').onclick=function(){go(i-1)};cr.querySelector('.next').onclick=function(){go(i+1)};
cr.addEventListener('mouseenter',stop);cr.addEventListener('mouseleave',play);cr.addEventListener('focusin',stop);play()}

/* Reviews: shared through the server (/api/reviews); falls back to this browser when there is no server */
var rl=d.getElementById('rv-list'),rf=d.getElementById('rv-form');
if(rl&&rf){var R=[],api=true,rm=d.getElementById('rv-msg');
var draw=function(){rl.textContent='';
if(!R.length){var l0=d.createElement('li');l0.textContent='No reviews yet. Be the first to write one.';rl.appendChild(l0)}
R.slice().reverse().forEach(function(r){var li=d.createElement('li'),bb=d.createElement('b'),st=d.createElement('span'),p=d.createElement('p');
bb.textContent=r.n;st.className='stars';st.textContent=' '+'★'.repeat(r.s)+'☆'.repeat(5-r.s);p.textContent=r.t;li.append(bb,st,p);rl.appendChild(li)})};
fetch('/api/reviews').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){R=j.map(function(x){return{n:x.name,s:x.stars,t:x.text}}).reverse();draw()})
.catch(function(){api=false;try{R=JSON.parse(g('reviews')||'[]')}catch(e){}draw()});
rf.addEventListener('submit',function(e){e.preventDefault();
var n=d.getElementById('rv-name').value.trim(),st=+d.getElementById('rv-star').value,tx=d.getElementById('rv-txt').value.trim();
if(!api){R.push({n:n,s:st,t:tx});s('reviews',JSON.stringify(R.slice(-50)));rf.reset();draw();return}
fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stars:st,text:tx})})
.then(function(r){return r.json().then(function(j){if(r.ok){rm.textContent='Thank you. Your review will appear after approval.';rf.reset()}else rm.textContent=j.error||'Could not send the review.'})})
.catch(function(){rm.textContent='Could not reach the server.'})})}

/* Account link: shows Dashboard when logged in */
fetch('/api/me').then(function(r){return r.json()}).then(function(j){var a=d.getElementById('acct');
if(j.user&&a){a.removeAttribute('data-en');a.textContent='Dashboard';a.href='dashboard.html';lang(h.lang)}}).catch(function(){});

/* Caching (service worker): works on http/https, not on file:// */
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js');
})();
