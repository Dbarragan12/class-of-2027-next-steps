import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";

const execFileAsync=promisify(execFile);
const file="data/scholarships.json";
const current=JSON.parse(await readFile(file,"utf8"));
let previous={scholarships:[]};
try {
  const {stdout}=await execFileAsync("git",["show","HEAD^:"+file]);
  previous=JSON.parse(stdout);
} catch {
  // The first run has no prior data to compare.
}

const isConfirmed=item=>String(item.status||"").startsWith("Confirmed");
const keyFields=["organization","award","eligibility","url","status","opens","deadline","expectedWindow","needs"];
const snapshot=item=>keyFields.map(key=>`${key}=${item[key]??""}`).join("\n");
const idFor=item=>createHash("sha256").update(snapshot(item)).digest("hex").slice(0,24);
const oldByName=new Map((previous.scholarships||[]).map(item=>[item.name,item]));
const updates=[];

for (const item of (current.scholarships||[]).filter(isConfirmed)) {
  const old=oldByName.get(item.name);
  if (!old || !isConfirmed(old)) {
    updates.push({item,reason:"Newly confirmed scholarship"});
  } else if (snapshot(old)!==snapshot(item)) {
    updates.push({item,reason:"Confirmed scholarship information changed"});
  }
}

if (!updates.length) {
  console.log("No new confirmed scholarship updates to email.");
  process.exit(0);
}

const webhook=process.env.SCHOLARSHIP_UPDATES_WEBHOOK;
const token=process.env.SCHOLARSHIP_UPDATES_TOKEN;
if (!webhook || !token) {
  console.log(`Found ${updates.length} confirmed update(s), but email alerts are not configured yet. Nothing was sent.`);
  process.exit(0);
}

const payload={
  token,
  type:"confirmed-scholarship-update",
  updates:updates.map(({item,reason})=>({
    id:idFor(item),
    reason,
    name:item.name,
    organization:item.organization||"",
    award:item.award||"See sponsor details",
    deadline:item.deadline||"",
    opens:item.opens||"",
    eligibility:item.eligibility||"",
    url:item.url||""
  }))
};
const response=await fetch(webhook,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
if (!response.ok) throw new Error(`Email update endpoint returned ${response.status}.`);
console.log(`Sent ${updates.length} confirmed scholarship update(s) to the private email service.`);
