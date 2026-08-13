import { writeFile, mkdir } from "node:fs/promises";

const base = "appwmu0W7lcUdJKwI";
const table = "tblMcgWzZPEYIrets";
const token = process.env.AIRTABLE_TOKEN;
if (!token) throw new Error("Missing AIRTABLE_TOKEN GitHub Actions secret.");

const fields = {
  scholarship:"fldY9uCXfOyYjRx6Q", organization:"fldkSXRRb56GwWyJc", award:"fldUkjlrlxxdsBcNF",
  eligibility:"fldePW5EAtdOJfN8k", url:"fldRu3WKFfing0IKk", status:"fldyGWeRXeS9FmMrX",
  deadline:"fldIub2983UNbGIjc", opens:"fld9Avz9o2FRS4Ep0", lastYearDeadline:"fld3ty2yW7QtTDQz2", expectedWindow:"fldhDa1ACyZ50EJAF",
  tags:"fldbK58Tz0AniOr5d", fit:"fldLSu7j3rf3jWWlW", lastChecked:"fldMcMFc60F9gs2p8", visibility:"fldCJjp25wrU7vpaF",
  toppenishEligibility:"fldZqDo2gACTCxDZi"
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
const choiceName=value=>typeof value==="string" ? value : value?.name;
const tagNames=value=>(value||[]).map(tag=>typeof tag==="string" ? tag : tag.name);

const canonicalTag = new Map([
  ["Local / Yakima County","Local"], ["Washington","Washington"],
  ["Farmworker / agriculture","Farmworker"], ["Latino / farmworker","Farmworker"],
  ["Yakama Nation / Indigenous","Indigenous"], ["Indigenous","Indigenous"],
  ["Undocumented / DACA-friendly","Undocumented"], ["4-year","Four-year"],
  ["Community college","Two-year"], ["Trades / apprenticeship","Trades"], ["Trades","Trades"],
  ["STEM / health","STEM / health"], ["Arts / writing","Arts / writing"],
  ["Financial need","Financial need"], ["low-income","Financial need"],
  ["First generation","First generation"], ["Disability","Disability"],
  ["LGBTQ+","LGBTQ+"], ["Leadership / service","Leadership / service"],
  ["No essay","No essay"], ["Open to most students","Open to most students"]
]);
const normalizeTags=value=>[...new Set(tagNames(value).map(t=>canonicalTag.get(t)).filter(Boolean))];
const fitKeys=(tags,eligibility,why)=>{
  const hay=[...tags,eligibility,why].join(" ").toLowerCase();
  const out=[];
  const add=k=>{ if(!out.includes(k)) out.push(k); };
  if(/local|washington/.test(hay)) add("local");
  if(/farmworker|agriculture|migrant|latino|hispanic/.test(hay)) add("ag");
  if(/indigenous|yakama|native american|tribal/.test(hay)) add("tribal");
  if(/financial need|low-income|low income/.test(hay)) add("lowincome");
  if(/first generation|first-generation/.test(hay)) add("firstgen");
  if(/disability|disabled/.test(hay)) add("disability");
  if(/lgbtq/.test(hay)) add("lgbtq");
  if(/leadership|service/.test(hay)) add("leadership");
  if(/open to most/.test(hay) || !out.length) add("everyone");
  return out;
};

const rejected=[];
const scholarships=records.map(r=>{
  const tags=normalizeTags(value(r,"tags"));
  const whyFit=value(r,"fit")||"";
  return {
    name:value(r,"scholarship"), organization:value(r,"organization"), award:value(r,"award"),
    eligibility:value(r,"eligibility"), url:value(r,"url"), status:choiceName(value(r,"status")),
    opens:value(r,"opens")||null, deadline:value(r,"deadline")||null,
    lastYearDeadline:value(r,"lastYearDeadline")||null, expectedWindow:value(r,"expectedWindow")||null,
    tags, fit:fitKeys(tags,value(r,"eligibility")||"",whyFit), whyFit,
    lastChecked:value(r,"lastChecked")||new Date().toISOString().slice(0,10),
    visibility:choiceName(value(r,"visibility")),
    toppenishEligibility:choiceName(value(r,"toppenishEligibility"))
  };
}).filter(x=>{
  const approved=x.visibility==="Publish"
    && x.toppenishEligibility==="Verified eligible"
    && x.name && x.organization && x.url
    && x.organization!=="Washington GEAR UP archive";
  const current=x.status==="Confirmed for 2027"
    && (x.deadline || /open now|rolling|year-round/i.test(x.expectedWindow||""));
  const planAhead=x.status==="Expected — last year's information"
    && x.lastYearDeadline && x.expectedWindow;
  const publishable=approved && (current || planAhead);
  if(!publishable && x.visibility==="Publish") rejected.push(x.name||"(unnamed record)");
  return publishable;
}).map(({visibility,toppenishEligibility,...x})=>x).sort((a,b)=>{
  const priority=x=>x.tags.includes("Local") ? 0 : (x.tags.includes("Washington") ? 1 : 2);
  return priority(a)-priority(b) || String(a.deadline||"9999").localeCompare(String(b.deadline||"9999"));
});

await mkdir("data",{recursive:true});
await writeFile("data/scholarships.json", JSON.stringify({
  updatedAt:new Date().toISOString(),
  publicationRule:"Only opportunities verified for Toppenish High School students. Current official opportunities need a current deadline or an open/rolling application; recurring plan-ahead items need an official source, a prior-cycle deadline, and an explicit warning that the next date may change.",
  scholarships
},null,2)+"\n");
console.log(`Synced ${scholarships.length} actionable scholarship records; held ${rejected.length} published records that failed the public-data contract.`);
