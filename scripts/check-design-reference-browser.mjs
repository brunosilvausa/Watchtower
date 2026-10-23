import { chromium } from "@playwright/test";
import fs from "node:fs";
(async () => {
 const browser = await chromium.launch(); const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const root='design-system/references'; const entries=fs.readdirSync(root,{recursive:true}).filter(p=>p.endsWith('.html')); const results=[];
 for(const entry of entries){
  const errors=[];const failed=[];const external=[];
  const error=e=>errors.push(e.message);const response=r=>{if(r.status()>=400)failed.push(r.url()+':'+r.status())};const request=r=>{if(r.url().startsWith('http')&&!r.url().startsWith('http://127.0.0.1:3139/'))external.push(r.url())};
  page.on('pageerror',error);page.on('response',response);page.on('request',request);
  await page.goto('http://127.0.0.1:3139/references/'+entry,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  if(entry==='playground/index.html')await page.screenshot({path:'docs/evidence/design-system/reference-desktop.png',fullPage:true});
  results.push({entry,errors,failed,external,bodyCharacters:(await page.locator('body').innerText()).length});
  page.off('pageerror',error);page.off('response',response);page.off('request',request);
 }
 await browser.close();fs.writeFileSync('docs/evidence/design-system/reference-browser.json',JSON.stringify(results,null,2)+'\n');
 const failures=results.filter(r=>r.errors.length||r.failed.length||r.external.length||r.bodyCharacters<5);
 console.log(JSON.stringify({pages:results.length,failures},null,2));process.exitCode=failures.length?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;});
