import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const data=JSON.parse(await readFile("data/scholarships.json","utf8"));
const today=new Date().toISOString().slice(0,10);
const checks=[];
for (const item of data.scholarships) {
  try {
    const response=await fetch(item.url,{redirect:"follow",headers:{"User-Agent":"ToppenishAdvisoryScholarshipChecker/1.0"}});
    const body=await response.text();
    checks.push({name:item.name,url:item.url,checkedAt:today,status:response.status,contentHash:createHash("sha256").update(body).digest("hex")});
    item.lastChecked=today;
  } catch (error) {
    checks.push({name:item.name,url:item.url,checkedAt:today,status:"error",error:error.message});
  }
}
await mkdir("data",{recursive:true});
await writeFile("data/source-checks.json",JSON.stringify({updatedAt:new Date().toISOString(),checks},null,2)+"\n");
await writeFile("data/scholarships.json",JSON.stringify(data,null,2)+"\n");
console.log(`Checked ${checks.length} official sources.`);