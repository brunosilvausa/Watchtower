window.WT = Object.assign({ Tilt: function (p) { return p.children; } }, window.WatchtowerDesignSystem_54a35d);
(function(){
const mk=(n,bad)=>Array.from({length:n},(_,i)=>bad[i]||'up');
window.WT_DATA = {
  workspaces:[{id:'acme',name:'Acme Ops',plan:'Team plan'},{id:'personal',name:'Maya’s homelab',plan:'Free plan'},{id:'client',name:'Northwind (client)',plan:'Team plan'}],
  user:{name:'Maya Ortiz',role:'Workspace owner'},
  monitors:[
    {id:'m1',name:'api.acme.dev',url:'https://api.acme.dev/health',type:'HTTPS',interval:'30s',regions:5,p95:142,uptime:'99.98%',status:'up',days:mk(30,{12:'degraded'})},
    {id:'m2',name:'checkout.acme.dev',url:'https://checkout.acme.dev/ping',type:'HTTPS',interval:'30s',regions:3,p95:1204,uptime:'99.71%',status:'degraded',days:mk(30,{20:'degraded',28:'degraded',29:'degraded'})},
    {id:'m3',name:'Nightly DB backup',url:'heartbeat · wt_hb_9f2c',type:'Heartbeat',interval:'24h',regions:0,p95:null,uptime:'96.67%',status:'down',days:mk(30,{29:'down'})},
    {id:'m4',name:'app.acme.dev',url:'https://app.acme.dev',type:'HTTPS',interval:'60s',regions:5,p95:318,uptime:'100%',status:'up',days:mk(30,{})},
    {id:'m5',name:'mail.acme.dev',url:'smtp://mail.acme.dev:587',type:'TCP',interval:'5m',regions:2,p95:64,uptime:'100%',status:'up',days:mk(30,{})},
    {id:'m6',name:'status.acme.dev',url:'https://status.acme.dev',type:'HTTPS',interval:'5m',regions:3,p95:96,uptime:'99.99%',status:'up',days:mk(30,{4:'degraded'})},
    {id:'m7',name:'staging-api',url:'https://staging.acme.dev/health',type:'HTTPS',interval:'5m',regions:1,p95:null,uptime:'—',status:'paused',days:Array(30).fill('none')},
  ],
  regions:[{name:'Frankfurt',code:'eu-central',p95:88,delta:'-2.1%',tone:'up'},{name:'Virginia',code:'us-east',p95:142,delta:'+0.9%',tone:'down'},{name:'Oregon',code:'us-west',p95:161,delta:'-1.1%',tone:'up'},{name:'Singapore',code:'ap-southeast',p95:233,delta:'+4.0%',tone:'down'},{name:'São Paulo',code:'sa-east',p95:207,delta:'-0.4%',tone:'up'}],
  incidents:[
    {id:'INC-0142',monitor:'Nightly DB backup',cause:'Heartbeat missed',started:'Today, 03:15',duration:'Ongoing',status:'down'},
    {id:'INC-0141',monitor:'checkout.acme.dev',cause:'p95 above 1,000ms',started:'Today, 01:48',duration:'Ongoing',status:'degraded'},
    {id:'INC-0140',monitor:'api.acme.dev',cause:'HTTP 502 from 3 regions',started:'Oct 09, 14:02',duration:'4m 12s',status:'up'},
    {id:'INC-0139',monitor:'status.acme.dev',cause:'TLS handshake timeout',started:'Sep 21, 22:40',duration:'1m 30s',status:'up'},
  ],
  alerts:[{who:'api.acme.dev',what:'Recovered',when:'2m ago',tone:'up'},{who:'checkout.acme.dev',what:'Slow · 1,204ms',when:'18m ago',tone:'degraded'},{who:'Nightly DB backup',what:'Heartbeat missed',when:'3h ago',tone:'down'},{who:'app.acme.dev',what:'Certificate renews in 21d',when:'6h ago',tone:'info'}],
  week:{labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],now:[148,156,151,212,166,139,142],prev:[150,158,149,160,152,146,147]},
  year:{labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],checks:[2.1,2.4,2.9,2.7,3.0,3.3,3.1,3.6,3.9,4.2,4.4,4.6],errors:[1.2,1.6,1.9,1.4,1.1,1.3,1.7,1.2,0.9,1.4,1.1,0.8]},
};})();
