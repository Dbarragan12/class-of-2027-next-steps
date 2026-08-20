import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const data=JSON.parse(await readFile("data/scholarships.json","utf8"));
if (!Array.isArray(data.scholarships) || data.scholarships.length === 0) {
  throw new Error("Refusing to publish an empty scholarship list. Restore or add scholarships manually before running the nightly check.");
}
let previous={checks:[]};
try { previous=JSON.parse(await readFile("data/source-checks.json","utf8")); } catch {}
const oldByUrl=new Map(previous.checks.map(item=>[item.url,item]));
const today=new Date().toISOString().slice(0,10);
const checks=[],review=[];

for (const item of data.scholarships) {
  try {
    const response=await fetch(item.url,{redirect:"follow",headers:{"User-Agent":"ToppenishAdvisoryScholarshipChecker/1.0"}});
    const body=await response.text();
    const contentHash=createHash("sha256").update(body.replace(/\s+/g," ")).digest("hex");
    const check={name:item.name,url:item.url,checkedAt:today,status:response.status,contentHash};
    checks.push(check);
    const old=oldByUrl.get(item.url);
    const sourceChanged=old && (old.status!==check.status || old.contentHash!==check.contentHash);
    if (!response.ok || sourceChanged) review.push({...check,reason:!response.ok ? "official link did not return a working page" : "official page content changed"});
    if (response.ok) item.lastChecked=today;
  } catch (error) {
    const check={name:item.name,url:item.url,checkedAt:today,status:"error",error:error.message};
    checks.push(check);
    review.push({...check,reason:"official link could not be checked"});
  }
}

const unavailable=review.filter(item=>item.status==="error" || Number(item.status)<200 || Number(item.status)>=400);
const changed=review.filter(item=>!unavailable.includes(item));
const updatedAt=new Date().toISOString();
const renderSection=(title,items)=>items.length
  ? `## ${title}\n\n${items.map(item=>`- [${item.name}](${item.url}) — ${item.reason}; check result: ${item.status}`).join("\n")}\n`
  : `## ${title}\n\nNone tonight.\n`;
const note=`# Scholarship source review\n\nChecked: ${updatedAt}\n\nThe overnight check only flags sources for staff review. It does not add scholarships, confirm dates, or change eligibility automatically. For a changed page, open the official source and look for the new cycle. For an unavailable page, repair or replace the link before publishing.\n\n${renderSection("Official page changed — review for new-cycle information",changed)}\n${renderSection("Link unavailable or check failed — repair or replace the source",unavailable)}`;

await mkdir("data",{recursive:true});
await writeFile("data/source-checks.json",JSON.stringify({updatedAt,checks},null,2)+"\n");
await writeFile("data/review-needed.md",note);
await writeFile("data/scholarships.json",JSON.stringify(data,null,2)+"\n");
console.log(`Checked ${checks.length} official sources; ${review.length} need review.`);
