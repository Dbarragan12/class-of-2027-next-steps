import { createHash } from "node:crypto";

const MONTHS={
  january:0,february:1,march:2,april:3,may:4,june:5,
  july:6,august:7,september:8,october:9,november:10,december:11
};
const GENERIC_WORDS=new Set(["a","an","and","award","awards","for","foundation","of","program","scholarship","scholarships","the"]);
const MUTABLE_FIELDS=new Set(["status","opens","deadline","expectedWindow","url","lastChecked"]);

export function decodeHtml(value=""){
  return String(value)
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
    .replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'").replace(/&ndash;/gi,"–").replace(/&mdash;/gi,"—");
}

export function htmlToText(html=""){
  return decodeHtml(String(html)
    .replace(/<!--[\s\S]*?-->/g," ")
    .replace(/<(script|style|svg|noscript|template)[^>]*>[\s\S]*?<\/\1>/gi," ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/section|\/article|\/tr)>/gi,"\n")
    .replace(/<[^>]+>/g," "))
    .replace(/[\t\r ]+/g," ").replace(/\n\s*\n+/g,"\n").trim();
}

function words(value){
  return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().split(/\s+/).filter(Boolean);
}

function meaningfulWords(value){
  return words(value).filter(word=>word.length>2 && !GENERIC_WORDS.has(word));
}

function overlapScore(a,b){
  const wanted=new Set(meaningfulWords(a));
  if(!wanted.size) return 0;
  const present=new Set(words(b));
  return [...wanted].filter(word=>present.has(word)).length/wanted.size;
}

function findContext(item,text,title,url,sharedSource){
  const normalized=text.toLowerCase();
  const names=[item.name,String(item.name||"").replace(/\s+[—–-].*$/," ").trim()].filter(Boolean);
  const locations=[];
  for(const name of names){
    const needle=name.toLowerCase();
    if(needle.length<8) continue;
    let at=normalized.indexOf(needle);
    while(at>=0 && locations.length<5){ locations.push(at); at=normalized.indexOf(needle,at+needle.length); }
  }
  if(locations.length){
    const before=sharedSource?0:900;
    const after=sharedSource?1800:2400;
    return locations.map(at=>text.slice(Math.max(0,at-before),Math.min(text.length,at+after))).join("\n");
  }
  if(sharedSource) return "";
  const lead=`${title} ${text.slice(0,3500)} ${url}`;
  return overlapScore(item.name,lead)>=0.5 ? text.slice(0,24000) : "";
}

function isoDate(year,month,day){
  const date=new Date(Date.UTC(Number(year),Number(month),Number(day)));
  if(date.getUTCFullYear()!==Number(year)||date.getUTCMonth()!==Number(month)||date.getUTCDate()!==Number(day)) return null;
  return date.toISOString().slice(0,10);
}

function parseDate(raw){
  const clean=String(raw).toLowerCase().replace(/(st|nd|rd|th)\b/g,"").replace(/,/g," ").replace(/\s+/g," ").trim();
  let match=clean.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\s+(20\d{2})$/);
  if(match) return isoDate(match[3],MONTHS[match[1]],match[2]);
  match=clean.match(/^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})$/);
  if(match) return isoDate(match[3],MONTHS[match[2]],match[1]);
  match=clean.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})$/);
  if(match) return isoDate(match[3],Number(match[1])-1,match[2]);
  match=clean.match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  if(match) return isoDate(match[1],Number(match[2])-1,match[3]);
  return null;
}

const DATE_PATTERN=/(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+20\d{2}|\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:,)?\s+20\d{2}|\d{1,2}[\/-]\d{1,2}[\/-]20\d{2}|20\d{2}-\d{2}-\d{2}/gi;

function dateCandidates(context,labels){
  const lower=context.toLowerCase();
  const found=[];
  for(const label of labels){
    let at=lower.indexOf(label);
    while(at>=0){
      const start=Math.max(0,at-45),end=Math.min(context.length,at+label.length+180);
      const excerpt=context.slice(start,end).replace(/\s+/g," ").trim();
      const before=context.slice(Math.max(0,at-90),at);
      const after=context.slice(at+label.length,Math.min(context.length,at+label.length+130));
      const beforeMatches=[...before.matchAll(DATE_PATTERN)];
      const beforeMatch=beforeMatches.at(-1);
      const afterMatch=[...after.matchAll(DATE_PATTERN)].find(match=>match.index<=45);
      const beforeTail=beforeMatch?before.slice(beforeMatch.index+beforeMatch[0].length):"";
      const nearest=/^\s*[:—–-]\s*$/.test(beforeTail)?beforeMatch:afterMatch;
      const value=nearest&&parseDate(nearest[0]);
      if(value) found.push({value,evidence:excerpt,label});
      at=lower.indexOf(label,at+label.length);
    }
  }
  return found;
}

function chooseDate(candidates,kind,now){
  if(!candidates.length) return null;
  const currentYear=now.getUTCFullYear();
  const labels=[...new Set(candidates.map(candidate=>candidate.label))];
  for(const label of labels){
    const unique=new Map();
    for(const candidate of candidates.filter(candidate=>candidate.label===label)){
      const year=Number(candidate.value.slice(0,4));
      if(year>=currentYear&&year<=currentYear+2&&!unique.has(candidate.value)) unique.set(candidate.value,candidate);
    }
    const plausible=[...unique.values()];
    const future=plausible.filter(({value})=>value>=now.toISOString().slice(0,10));
    if(kind==="deadline"&&future.length===1) return future[0];
    if(kind!=="deadline"&&plausible.length===1) return plausible[0];
  }
  return null;
}

function sameOfficialHost(original,finalUrl){
  try {
    const a=new URL(original),b=new URL(finalUrl);
    const base=host=>host.replace(/^www\./,"").split(".").slice(-2).join(".");
    return a.protocol==="https:" && b.protocol==="https:" && base(a.hostname)===base(b.hostname);
  } catch { return false; }
}

function displayDate(value){
  const [year,month,day]=value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(year,month-1,day)));
}

function setUpdate(updates,evidence,field,value,why,item){
  if(value==null || item[field]===value) return;
  updates[field]=value;
  evidence.push({field,value,why});
}

export function analyzeScholarshipSource({item,html,finalUrl=item.url,sharedSource=false,now=new Date()}){
  const title=decodeHtml(String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/\s+/g," ").trim();
  const text=htmlToText(html);
  const context=findContext(item,text,title,finalUrl,sharedSource);
  const updates={},evidence=[],review=[];
  if(!context){
    return {updates,evidence,review:["The checker could not isolate this scholarship on the official page."],contentHash:createHash("sha256").update(text.slice(0,24000)).digest("hex")};
  }

  const deadline=chooseDate(dateCandidates(context,["application closes","applications close","application deadline","submit by","due by","postmarked by","received by","deadline","closes"]),"deadline",now);
  let opens=chooseDate(dateCandidates(context,["applications open","application opens","opens on","opening date"]),"opens",now);
  const rolling=/applications? (?:are )?(?:accepted|open) (?:year[- ]round|every quarter|on a rolling basis)|rolling deadline/i.test(context);

  if(opens&&item.deadline&&opens.value===item.deadline&&item.opens&&item.opens!==opens.value) opens=null;
  const usableOpen=opens&&(opens.value>=now.toISOString().slice(0,10)||deadline||rolling);

  if(usableOpen) setUpdate(updates,evidence,"opens",opens.value,opens.evidence,item);
  if(deadline) setUpdate(updates,evidence,"deadline",deadline.value,deadline.evidence,item);

  const dateChanged=(deadline&&deadline.value!==item.deadline)||(usableOpen&&opens.value!==item.opens);
  if(deadline || usableOpen || rolling){
    if(deadline||rolling) setUpdate(updates,evidence,"status","Confirmed for 2027","The official source contains an unambiguous current-cycle deadline or rolling status.",item);
    let window;
    if(rolling) window="Open now — the official source says applications are accepted year-round or on a rolling schedule.";
    else if(usableOpen && deadline) window=`Applications open ${displayDate(opens.value)} and close ${displayDate(deadline.value)}.`;
    else if(deadline) window=`Confirmed deadline: ${displayDate(deadline.value)}.`;
    else window=`Applications open ${displayDate(opens.value)}; the official source does not show one unambiguous deadline yet.`;
    if(dateChanged||(deadline||rolling)&&!String(item.status||"").startsWith("Confirmed")) setUpdate(updates,evidence,"expectedWindow",window,"Summary generated only from the confirmed dates found on the official source.",item);
  }

  if(finalUrl!==item.url && sameOfficialHost(item.url,finalUrl)){
    setUpdate(updates,evidence,"url",finalUrl,"The existing official link redirected to this page on the same sponsor domain.",item);
  }
  if(!deadline && !usableOpen && !rolling) review.push("No single future opening, future deadline, or rolling status could be confirmed automatically.");
  return {updates,evidence,review,contentHash:createHash("sha256").update(context.replace(/\s+/g," ")).digest("hex")};
}

export function applyAllowedUpdates(item,updates){
  for(const [field,value] of Object.entries(updates)){
    if(!MUTABLE_FIELDS.has(field)) throw new Error(`Automatic updater is not allowed to change ${field}.`);
    item[field]=value;
  }
  return item;
}

export function validateRoster(before,after){
  if(!Array.isArray(before)||!Array.isArray(after)||before.length!==after.length){
    throw new Error("Scholarship roster changed size. Automatic publishing is blocked.");
  }
  const identity=list=>list.map(item=>`${item.name}\u0000${item.organization||""}`).sort();
  const a=identity(before),b=identity(after);
  if(a.some((value,index)=>value!==b[index])) throw new Error("A scholarship was added, removed, renamed, or moved to another organization. Automatic publishing is blocked.");
  const names=after.map(item=>item.name);
  if(new Set(names).size!==names.length) throw new Error("Duplicate scholarship names detected. Automatic publishing is blocked.");
  return true;
}
