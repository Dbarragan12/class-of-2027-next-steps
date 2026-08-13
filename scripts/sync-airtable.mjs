import { writeFile, mkdir } from "node:fs/promises";

const base = "appwmu0W7lcUdJKwI";
const table = "tblMcgWzZPEYIrets";
const token = process.env.AIRTABLE_TOKEN;
if (!token) throw new Error("Missing AIRTABLE_TOKEN GitHub Actions secret.");

const fields = {
  scholarship:"fldY9uCXfOyYjRx6Q", organization:"fldkSXRRb56GwWyJc", award:"fldUkjlrlxxdsBcNF",
  eligibility:"fldePW5EAtdOJfN8k", url:"fldRu3WKFfing0IKk", status:"fldyGWeRXeS9FmMrX",
  deadline:"fldIub2983UNbGIjc", lastYearDeadline:"fld3ty2yW7QtTDQz2", expectedWindow:"fldhDa1ACyZ50EJAF",
  tags:"fldbK58Tz0AniOr5d", fit:"fldLSu7j3rf3jWWlW", lastChecked:"fldMcMFc60F9gs2p8", visibility:"fldCJjp25wrU7vpaF"
};
let offset, records=[];
do {
  const url = new URL(`https://api.airtable.com/v0/${base}/${table}`);
  if (offset) url.searchParams.set("offset", offset);
  const response = await fetch(url, {headers:{Authorization:`Bearer ${token}`}});
  if (!response.ok) throw new Error(`Airtable request failed: ${response.status}`);
  const page = await response.json(); records.push(...page.records); offset=page.offset;
} while(offset);

const value=(r,key)=>r.fields[fields[key]];
const scholarships=records.filter(r=>value(r,"visibility")?.name==="Publish").map(r=>({
  name:value(r,"scholarship"), organization:value(r,"organization"), award:value(r,"award"),
  eligibility:value(r,"eligibility"), url:value(r,"url"), status:value(r,"status")?.name,
  deadline:value(r,"deadline"), lastYearDeadline:value(r,"lastYearDeadline"), expectedWindow:value(r,"expectedWindow"),
  tags:(value(r,"tags")||[]).map(t=>t.name), fit:value(r,"fit"), lastChecked:value(r,"lastChecked")||new Date().toISOString().slice(0,10)
})).filter(x=>x.name&&x.url&&x.status);

await mkdir("data",{recursive:true});
await writeFile("data/scholarships.json", JSON.stringify({updatedAt:new Date().toISOString(),scholarships},null,2)+"\n");
console.log(`Synced ${scholarships.length} published scholarship records.`);