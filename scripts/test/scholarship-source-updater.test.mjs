import test from "node:test";
import assert from "node:assert/strict";
import { analyzeScholarshipSource,applyAllowedUpdates,validateRoster } from "../lib/scholarship-source-updater.mjs";

const now=new Date("2026-08-21T12:00:00Z");
const item={name:"Toppenish Promise Scholarship",organization:"Promise Fund",url:"https://example.org/promise",status:"Expected — last year's information",opens:null,deadline:null,expectedWindow:"Planning only"};

test("promotes an existing record from explicit current-cycle dates",()=>{
  const html=`<title>Toppenish Promise Scholarship</title><main><h1>Toppenish Promise Scholarship</h1><p>Applications open September 1, 2026. Application deadline: February 2, 2027.</p></main>`;
  const result=analyzeScholarshipSource({item:{...item},html,now});
  assert.equal(result.updates.opens,"2026-09-01");
  assert.equal(result.updates.deadline,"2027-02-02");
  assert.equal(result.updates.status,"Confirmed for 2027");
});

test("does not steal a date from another scholarship on a shared page",()=>{
  const html=`<main><h2>Other Scholarship</h2><p>Application deadline: October 1, 2026.</p><h2>Toppenish Promise Scholarship</h2><p>The next cycle will be announced later.</p></main>`;
  const result=analyzeScholarshipSource({item:{...item},html,sharedSource:true,now});
  assert.equal(result.updates.deadline,undefined);
  assert.ok(result.review.length);
});

test("recognizes an explicit rolling application",()=>{
  const html=`<title>Toppenish Promise Scholarship</title><main><h1>Toppenish Promise Scholarship</h1><p>Applications are accepted year-round.</p></main>`;
  const result=analyzeScholarshipSource({item:{...item},html,now});
  assert.equal(result.updates.status,"Confirmed for 2027");
  assert.match(result.updates.expectedWindow,/year-round/);
});

test("does not promote an expired prior-cycle deadline",()=>{
  const html=`<title>Toppenish Promise Scholarship</title><main><h1>Toppenish Promise Scholarship</h1><p>Application deadline: April 15, 2026.</p></main>`;
  const result=analyzeScholarshipSource({item:{...item},html,now});
  assert.equal(result.updates.deadline,undefined);
  assert.equal(result.updates.status,undefined);
});

test("reads a timeline date placed before the opening label",()=>{
  const html=`<title>Toppenish Promise Scholarship</title><main><h1>Toppenish Promise Scholarship</h1><p>September 3, 2026: Application opens</p><p>Application deadline: November 20, 2026.</p></main>`;
  const result=analyzeScholarshipSource({item:{...item},html,now});
  assert.equal(result.updates.opens,"2026-09-03");
  assert.equal(result.updates.deadline,"2026-11-20");
});

test("prefers an explicit application close date over a secondary document date",()=>{
  const html=`<title>Toppenish Promise Scholarship</title><main><h1>Toppenish Promise Scholarship</h1><p>Application opens 12/01/2026</p><p>Application closes 1/30/2027</p><p>Documents due 2/5/2027</p></main>`;
  const result=analyzeScholarshipSource({item:{...item},html,now});
  assert.equal(result.updates.deadline,"2027-01-30");
});

test("allows only approved fields",()=>{
  assert.throws(()=>applyAllowedUpdates({...item},{name:"Changed"}),/not allowed/);
});

test("blocks additions, removals, and renames",()=>{
  const before=[{name:"A",organization:"Org"},{name:"B",organization:"Org"}];
  assert.equal(validateRoster(before,before.map(x=>({...x}))),true);
  assert.throws(()=>validateRoster(before,[...before,{name:"C",organization:"Org"}]),/changed size/);
  assert.throws(()=>validateRoster(before,[{name:"A2",organization:"Org"},{name:"B",organization:"Org"}]),/added, removed, renamed/);
});
