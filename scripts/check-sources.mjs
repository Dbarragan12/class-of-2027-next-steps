import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const data=JSON.parse(await readFile("data/scholarships.json","utf8"));
let previous={checks:[]};
try { previous=JSON.parse(await readFile("data/source-checks.json","utf8")); } catch {}
const oldByUrl=new Map(previous.checks.map(item=>[item.url,item]));
const today=new Date().toISOString().slice(0,10);
const checks=[],changed=[];

for (const item of data.scholarships) {
  try {
    const response=await fetch(item.url,{redirect:"follow",headers:{"User-Agent":"ToppenishAdvisoryScholarshipChecker/1.0"}});
    const body=await response.text();
    const contentHash=createHash("sha256").update(body.replace(/\s+/g," ")).digest("hex");
    const check={name:item.name,url:item.url,checkedAt:today,status:response.status,contentHash};
    checks.push(check);
    const old=oldByUrl.get(item.url);
    if (old && (old.status!==check.status || old.contentHash!==check.contentHash)) changed.push(check);
    item.lastChecked=today;
  } catch (error) {
    const check={name:item.name,url:item.url,checkedAt:today,status:"error",error:error.message};
    checks.push(check);
    if (oldByUrl.has(item.url)) changed.push(check);
  }
}

const note=changed.length
  ? "# Scholarship sources needing review\n\nOfficial pages changed during the nightly check. Open each official page and update the matching Airtable record before changing its status to **Confirmed for 2027**.\n\n"+changed.map(item=>`- [${item.name}](${item.url}) — check result: ${item.status}`).join("\n")+"\n"
  : "# Scholarship sources needing review\n\nNo changes were detected in tonight's official-source check.\n";

await mkdir("data",{recursive:true});
await writeFile("data/source-checks.json",JSON.stringify({updatedAt:new Date().toISOString(),checks},null,2)+"\n");
await writeFile("data/review-needed.md",note);
await writeFile("data/scholarships.json",JSON.stringify(data,null,2)+"\n");
console.log(`Checked ${checks.length} official sources; ${changed.length} need review.`);
