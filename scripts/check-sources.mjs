import { readFile,writeFile,mkdir } from "node:fs/promises";
import { analyzeScholarshipSource,applyAllowedUpdates,validateRoster } from "./lib/scholarship-source-updater.mjs";

const DATA_FILE="data/scholarships.json";
const MAX_BODY_LENGTH=2_000_000;
const MAX_AUTOMATIC_RECORD_UPDATES=Number(process.env.MAX_AUTOMATIC_RECORD_UPDATES||25);
const now=new Date();
const today=now.toISOString().slice(0,10);
const updatedAt=now.toISOString();
const data=JSON.parse(await readFile(DATA_FILE,"utf8"));

if(!Array.isArray(data.scholarships)||data.scholarships.length===0){
  throw new Error("Refusing to publish an empty scholarship list. Restore or add scholarships manually before running the nightly check.");
}

const originalScholarships=structuredClone(data.scholarships);
const urlCounts=new Map();
for(const item of data.scholarships) urlCounts.set(item.url,(urlCounts.get(item.url)||0)+1);

let previous={checks:[]};
try{ previous=JSON.parse(await readFile("data/source-checks.json","utf8")); }catch{}
const oldByIdentity=new Map((previous.checks||[]).map(item=>[`${item.name}\u0000${item.url}`,item]));
const fetchCache=new Map();
const checks=[],review=[],changes=[];

async function fetchSource(url){
  if(fetchCache.has(url)) return fetchCache.get(url);
  const promise=(async()=>{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),25_000);
    try{
      const response=await fetch(url,{redirect:"follow",signal:controller.signal,headers:{"User-Agent":"ToppenishScholarshipUpdater/2.0 (+https://dbarragan12.github.io/class-of-2027-next-steps/scholarships.html)"}});
      const contentType=response.headers.get("content-type")||"";
      const body=(await response.text()).slice(0,MAX_BODY_LENGTH);
      return {status:response.status,ok:response.ok,finalUrl:response.url||url,contentType,body};
    }finally{ clearTimeout(timeout); }
  })();
  fetchCache.set(url,promise);
  return promise;
}

for(const item of data.scholarships){
  const identity=`${item.name}\u0000${item.url}`;
  try{
    const source=await fetchSource(item.url);
    const check={name:item.name,url:item.url,finalUrl:source.finalUrl,checkedAt:today,status:source.status};
    if(!source.ok){
      checks.push(check);
      review.push({...check,reason:"Official link did not return a working page."});
      continue;
    }
    if(!/text\/html|text\/plain|application\/xhtml\+xml/i.test(source.contentType)){
      item.lastChecked=today;
      checks.push({...check,contentType:source.contentType});
      review.push({...check,reason:"The source is a PDF or another format that the safe automatic reader cannot interpret."});
      continue;
    }

    const result=analyzeScholarshipSource({item,html:source.body,finalUrl:source.finalUrl,sharedSource:urlCounts.get(item.url)>1,now});
    check.contentHash=result.contentHash;
    check.automaticFields=Object.keys(result.updates).filter(field=>field!=="lastChecked");
    const old=oldByIdentity.get(identity);
    const sourceChanged=Boolean(old&&(old.status!==check.status||old.contentHash!==check.contentHash));
    const before=structuredClone(item);
    applyAllowedUpdates(item,result.updates);
    item.lastChecked=today;
    const changedFields=Object.keys(result.updates).filter(field=>before[field]!==item[field]);
    if(changedFields.length){
      changes.push({
        name:item.name,
        organization:item.organization||"",
        source:item.url,
        checkedAt:today,
        fields:changedFields.map(field=>({field,before:before[field]??null,after:item[field]??null})),
        evidence:result.evidence.filter(entry=>changedFields.includes(entry.field))
      });
    }else if(sourceChanged||result.review.length){
      review.push({...check,reason:result.review[0]||"The official page changed, but no unambiguous current-cycle information was safe to publish automatically."});
    }
    checks.push(check);
  }catch(error){
    const check={name:item.name,url:item.url,checkedAt:today,status:"error",error:error.name==="AbortError"?"Timed out after 25 seconds.":error.message};
    checks.push(check);
    review.push({...check,reason:"Official link could not be checked."});
  }
}

validateRoster(originalScholarships,data.scholarships);
if(changes.length>MAX_AUTOMATIC_RECORD_UPDATES){
  throw new Error(`The updater proposed changes to ${changes.length} scholarships, above the safety limit of ${MAX_AUTOMATIC_RECORD_UPDATES}. Nothing was written.`);
}
if(changes.length) data.updatedAt=today;

const unavailable=review.filter(item=>item.status==="error"||Number(item.status)<200||Number(item.status)>=400);
const needsHuman=review.filter(item=>!unavailable.includes(item));
const renderSection=(title,items)=>items.length
  ? `## ${title}\n\n${items.map(item=>`- [${item.name}](${item.url}) — ${item.reason} Check result: ${item.status}.`).join("\n")}\n`
  : `## ${title}\n\nNone tonight.\n`;
const automaticReviewItems=changes.map(item=>({name:item.name,url:item.source,status:"updated",reason:`Updated ${item.fields.map(field=>field.field).join(", ")}.`}));
const note=`# Scholarship source review\n\nChecked: ${updatedAt}\n\nThe nightly system checks only scholarships already in the public list. It may update an existing card when the sponsor page shows one unambiguous future opening, future deadline, rolling status, or same-sponsor redirect. It cannot add, remove, or rename a scholarship. Ambiguous information remains unchanged for staff review.\n\n${renderSection("Updated automatically from an official source",automaticReviewItems)}\n${renderSection("Needs a person to review the official source",needsHuman)}\n${renderSection("Link unavailable or check failed",unavailable)}`;

await mkdir("data",{recursive:true});
await writeFile("data/source-checks.json",JSON.stringify({updatedAt,mode:"existing-records-only",checks},null,2)+"\n");
await writeFile("data/automatic-updates.json",JSON.stringify({updatedAt,mode:"existing-records-only",recordCount:data.scholarships.length,changes,reviewCount:review.length},null,2)+"\n");
await writeFile("data/review-needed.md",note);
await writeFile(DATA_FILE,JSON.stringify(data,null,2)+"\n");
console.log(`Checked ${checks.length} existing scholarships; updated ${changes.length}; ${review.length} need human review; added 0.`);
