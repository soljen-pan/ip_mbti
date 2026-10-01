import chromium from '../../render-tools/node_modules/@sparticuz/chromium/build/index.js';
import http from 'node:http';
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
const require=createRequire(import.meta.url);const {chromium:pw}=require('playwright');
process.env.TMPDIR='/workspace/scratch/16cec2d864ae/ru-xi-render-tmp2';process.env.FONTCONFIG_PATH='/etc/fonts';
const browser=await pw.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true});const page=await browser.newPage({viewport:{width:421,height:862},deviceScaleFactor:2});
const server=http.createServer((req,res)=>{let file=path.resolve('ru-xi-ui-production-v5',decodeURIComponent(req.url||'/').slice(1));if((req.url||'/').endsWith('/'))file=path.join(file,'index.html');if(!file.includes('ru-xi-ui-production-v5')){res.writeHead(403).end();return}try{let data=fs.readFileSync(file);let ext=path.extname(file);res.setHeader('Content-Type',ext==='.css'?'text/css':ext==='.js'?'text/javascript':ext==='.json'?'application/json':ext==='.png'?'image/png':ext==='.webp'?'image/webp':ext==='.ttf'?'font/ttf':'text/html');res.end(data)}catch{res.writeHead(404).end()}});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const url=`http://127.0.0.1:${server.address().port}/preview/`;const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto(url);await page.waitForFunction('Object.keys(window.__rxDemo||{}).length>0 && document.fonts.status==="loaded"');
const jobs=[
['01-首页-未登录',{route:'home',tab:'home',auth:false,report:false,answers:{}}],
['02-首页-测试中',{route:'home',tab:'home',auth:true,nickname:'小林',profileDone:true,report:false,answers:Object.fromEntries(Array.from({length:18},(_,i)=>[`B${String(i+1).padStart(3,'0')}`,3]))}],
['03-个人结果',{route:'result',auth:true,nickname:'小林',profileDone:true,report:true,resultTab:'档案解读'}],
['04-基础答题',{route:'quiz',auth:true,quizIndex:0,answers:{B001:3}}],
['05-我的-未登录',{route:'me',tab:'me',auth:false,report:false}],
['06-我的-已登录',{route:'me',tab:'me',auth:true,nickname:'小林',profileDone:true,report:true}],
['07-找搭子',{route:'partners',auth:true,report:true}],
['08-找主题',{route:'themes',auth:true,report:true}],
['09-微信登录示意',{route:'auth',auth:false}],
['10-头像昵称',{route:'profile',auth:true,profileDone:false,nickname:''}],
['11-分支说明',{route:'branchGate',auth:true}],
['12-答卷检查',{route:'review',auth:true}],
['13-六星图',{route:'result',auth:true,report:true,resultTab:'六星图'}],
['14-角色图鉴',{route:'catalog',auth:false}],
['15-邀请好友',{route:'invite',auth:true}],
['16-本场安排',{route:'conditions',auth:true}],
['17-主题详情',{route:'themeDetail',auth:true}],
['18-队伍适配',{route:'themeFit',auth:true}],
['19-预约申请',{route:'bookingForm',auth:true}],
['20-预约进度',{route:'bookingStatus',auth:true,bookingStage:'merchant_review'}],
['21-商家工作台',{route:'merchant',auth:true,merchant:true}],
['22-开场资料',{route:'intake',auth:false}],
['23-补充答题',{route:'branchQuiz',auth:true,branchIndex:0}],
['24-角色介绍',{route:'catalogDetail',auth:false}],
['25-类型搭配',{route:'pair',auth:false}],
['26-队伍详情',{route:'team',auth:true}],
['27-分享预览',{route:'share',auth:true,report:true}],
['28-历史报告',{route:'history',auth:true,report:true}],
['29-题材偏好',{route:'preferences',auth:true}],
['30-隐私设置',{route:'settings',auth:true}],
['31-商家主题编辑',{route:'merchantTheme',auth:true,merchant:true}],
['32-商家预约申请',{route:'merchantRequests',auth:true,merchant:true}],
['33-玩法指南',{route:'guide',auth:false}],
['34-首页-已登录未测试',{route:'home',auth:true,report:false,answers:{},nickname:'小林'}],
['35-首页-访客已完成',{route:'home',auth:false,report:true}]
];
const output=path.resolve('ru-xi-ui-production-v5/screenshots');fs.mkdirSync(output,{recursive:true});
for(const [name,st] of jobs){await page.evaluate(v=>window.__rxDemo.setState(v),st);await page.waitForTimeout(130);const phone=page.locator('.phone');await phone.screenshot({path:path.join(output,name+'.png')});if(await page.locator('.scroll').evaluate(n=>n.scrollWidth>n.clientWidth+1))errs.push(`${name}: horizontal overflow`)}
for(const width of [320,430]){await page.setViewportSize({width,height:812});for(const route of ['home','quiz','result','partners','themeDetail','bookingForm']){await page.evaluate(v=>window.__rxDemo.setState(v),{route,auth:true,report:true,answers:{B001:3}});await page.waitForTimeout(35);let overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)errs.push(`${width}px ${route}: outer horizontal overflow`);if(route==='home')await page.screenshot({path:path.join(path.resolve('ru-xi-ui-production-v5/reference'),`responsive-${width}.png`)})}}await page.setViewportSize({width:421,height:862});
await page.evaluate(()=>window.__rxDemo.reset());
await page.getByText('开始探索 →').click();if(await page.locator('.nav-title').textContent()!=='入戏资料')errs.push('start route incorrect');
await page.getByText('进入测试 →').click();await page.locator('[data-action="answer:3"]').click();if(!(await page.getByText('下一题 →').isEnabled()))errs.push('quiz selection incorrect');
await page.getByText('下一题 →').click();await page.getByText('保存退出').click();if(await page.locator('.nav-title').textContent()!=='入戏档案')errs.push('exit route incorrect');
await page.locator('[data-action="route:partners"]').first().click();await page.getByText('邀请好友 →').click();if(await page.locator('.nav-title').textContent()!=='登录')errs.push('login gate incorrect');
await page.getByText('演示登录（仅预览）').click();if(await page.locator('.nav-title').textContent()!=='完善资料')errs.push('profile step incorrect');
await page.locator('#nick').fill('小林');await page.getByText('保存资料').click();if(await page.locator('.nav-title').textContent()!=='邀请好友')errs.push('return after login incorrect');
await page.locator('[aria-label="返回首页"]').click();if(await page.locator('.nav-title').textContent()!=='入戏档案')errs.push('home fallback incorrect');
await page.evaluate(()=>window.__rxDemo.setState({route:'partners',auth:false}));await page.evaluate(()=>window.__rxDemo.open('team'));if(await page.locator('.nav-title').textContent()!=='登录')errs.push('guest team should require login');await page.getByText('先逛逛').click();if(await page.locator('.nav-title').textContent()!=='找搭子')errs.push('login cancel return route');
await page.evaluate(()=>window.__rxDemo.setState({route:'quiz',quizIndex:0,answers:{}}));await page.locator('[data-action="answer:5"]').click();if((await page.evaluate(()=>window.__rxDemo.getState())).answers.B001!==5)errs.push('unknown value not stored distinctly');await page.locator('[data-action="answer:2"]').click();if((await page.evaluate(()=>window.__rxDemo.getState())).answers.B001!==2)errs.push('center value not distinct');
await page.evaluate(()=>window.__rxDemo.setState({route:'branchQuiz',branchIndex:7,branchAnswers:{H005:0}}));if(await page.getByText('害怕时容易叫出声，需要陪同').count())errs.push('H008 parent filter wrong');if(!await page.getByText('会怕或会叫，但仍敢做任务').count())errs.push('H008 parent option missing');
console.log(JSON.stringify({screens:jobs.length,checks:13,errors:errs},null,2));await browser.close();server.close();if(errs.length)process.exit(1);
