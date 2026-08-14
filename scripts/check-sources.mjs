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

const note=review.length
  ? "# Scholarship sources needing review\n\nOne or more official sources changed or could not be verified during the nightly check. Open each official page and update the matching record in `data/scholarships.json` before changing its status to **Confirmed for 2027**. The nightly process does not change deadlines or statuses automatically.\n\n"+review.map(item=>`- [${item.name}](${item.url}) — ${item.reason}; check result: ${item.status}`).join("\n")+"\n"
  : "# Scholarship sources needing review\n\nNo changes were detected in tonight's official-source check.\n";

await mkdir("data",{recursive:true});
await writeFile("data/source-checks.json",JSON.stringify({updatedAt:new Date().toISOString(),checks},null,2)+"\n");
await writeFile("data/review-needed.md",note);
await writeFile("data/scholarships.json",JSON.stringify(data,null,2)+"\n");
console.log(`Checked ${checks.length} official sources; ${review.length} need review.`);
