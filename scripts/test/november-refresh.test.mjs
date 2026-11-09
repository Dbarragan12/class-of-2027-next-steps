import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {analyzeScholarshipSource} from '../lib/scholarship-source-updater.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../../data/scholarships.json',import.meta.url),'utf8'));
const html=fs.readFileSync(new URL('../../scholarships.html',import.meta.url),'utf8');
const context=vm.createContext({Date});
vm.runInContext("const today=new Date(2026,10,9),DAY=86400000;"+html.slice(html.indexOf('function parseDate('),html.indexOf('function saveState(')),context);
test('reviewed records survive misleading dates in nightly source extraction',()=>{
 const item=data.scholarships.find(x=>x.name==='Truman D. Picard Scholarship');
 const result=analyzeScholarshipSource({item,now:new Date('2026-11-09'),html:'<title>Truman D. Picard Scholarship</title><h1>Truman D. Picard Scholarship</h1><p>Deadline: January 8, 2027</p>'});
 assert.deepEqual(result.updates,{});
 assert.ok(result.review.length);
});
test('dates are ordered, names unique, and roster preserved',()=>{
 assert.ok(data.scholarships.length >= 91);
 assert.equal(new Set(data.scholarships.map(x=>x.name)).size,data.scholarships.length);
 for(const x of data.scholarships) if(x.opens&&x.deadline) assert.ok(x.opens<=x.deadline,x.name);
});
test('verified future cycle is upcoming and uncertain records are planning',()=>{
 context.item=data.scholarships.find(x=>x.name.endsWith('— Career & Technical'));
 assert.equal(vm.runInContext('status(mapItem(item)).kind',context),'soon');
 context.item={name:'Unknown',status:'Confirmed for 2027'};
 assert.equal(vm.runInContext('mapItem(item).planning',context),true);
 context.item=data.scholarships.find(x=>x.name==='GSBA Scholarship Fund');
 assert.equal(vm.runInContext('status(mapItem(item)).kind',context),'open');
});
test('page does not override refreshed dates and excludes closed programs',()=>{
 assert.ok(!html.includes("'Washington State Opportunity Scholarship — Career & Technical':"));
 assert.ok(!html.includes("'Burger King Scholars':"));
 assert.ok(html.includes("raw.filter(x=>!String(x.status||'').startsWith('Closed'))"));
 for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
});
