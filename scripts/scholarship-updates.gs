/**
 * Private email bridge for the Toppenish Scholarship Finder.
 *
 * Keep this script attached to the private Google Sheet in the work Shared Drive.
 * Required Script Properties:
 *   SUBSCRIBER_SHEET_ID - the private spreadsheet ID
 *   WEBHOOK_TOKEN       - a long random value shared only with GitHub Actions
 *
 * Tabs and headers:
 *   Subscribers: Email | Name | OptedIn | Unsubscribed | AddedAt | LastSentAt
 *   Sent Updates: UpdateId | SentAt | ScholarshipName
 */
const SHEET_NAMES={subscribers:"Subscribers",sent:"Sent Updates"};

function doPost(event){
  try {
    const body=JSON.parse(event.postData?.contents||"{}");
    if (body.token!==property_("WEBHOOK_TOKEN")) return json_({ok:false,error:"Unauthorized"});
    if (body.type!=="confirmed-scholarship-update"||!Array.isArray(body.updates)) {
      return json_({ok:false,error:"Invalid update payload"});
    }
    const result=sendUpdates_(body.updates);
    return json_({ok:true,...result});
  } catch(error) {
    console.error(error);
    return json_({ok:false,error:String(error)});
  }
}

function setupTabs(){
  const book=SpreadsheetApp.openById(property_("SUBSCRIBER_SHEET_ID"));
  const subscribers=book.getSheetByName(SHEET_NAMES.subscribers)||book.insertSheet(SHEET_NAMES.subscribers);
  const sent=book.getSheetByName(SHEET_NAMES.sent)||book.insertSheet(SHEET_NAMES.sent);
  if (subscribers.getLastRow()===0) subscribers.appendRow(["Email","Name","OptedIn","Unsubscribed","AddedAt","LastSentAt"]);
  if (sent.getLastRow()===0) sent.appendRow(["UpdateId","SentAt","ScholarshipName"]);
}

function sendUpdates_(updates){
  const book=SpreadsheetApp.openById(property_("SUBSCRIBER_SHEET_ID"));
  const subscribers=book.getSheetByName(SHEET_NAMES.subscribers);
  const sent=book.getSheetByName(SHEET_NAMES.sent);
  if (!subscribers||!sent) throw new Error("Run setupTabs() before sending updates.");

  const sentIds=new Set(sent.getLastRow()>1?sent.getRange(2,1,sent.getLastRow()-1,1).getValues().flat().map(String):[]);
  const rows=subscribers.getLastRow()>1?subscribers.getRange(2,1,subscribers.getLastRow()-1,6).getValues():[];
  let recipients=0,skipped=0;
  for (const update of updates) {
    if (!update.id||sentIds.has(String(update.id))) { skipped++; continue; }
    const subject=`Scholarship update: ${update.name}`;
    const body=message_(update);
    for (let index=0;index<rows.length;index++) {
      const [email,name,optedIn,unsubscribed]=rows[index];
      if (!email||!truthy_(optedIn)||truthy_(unsubscribed)) continue;
      MailApp.sendEmail({to:String(email),subject,body,htmlBody:htmlMessage_(update,name)});
      subscribers.getRange(index+2,6).setValue(new Date());
      recipients++;
    }
    sent.appendRow([update.id,new Date(),update.name||""]);
    sentIds.add(String(update.id));
  }
  return {recipients,skipped};
}

function message_(update){
  return [
    update.reason||"Confirmed scholarship update",
    "",
    update.name,
    update.organization,
    `Award: ${update.award||"See sponsor details"}`,
    update.deadline?`Deadline: ${update.deadline}`:"Deadline: Check the sponsor page",
    update.opens?`Opens: ${update.opens}`:"",
    `Eligibility: ${update.eligibility||"Read the sponsor page carefully."}`,
    "",
    `Open the official scholarship page: ${update.url}`,
    "",
    "You are receiving this because you opted in to scholarship updates. Ask the project administrator to remove your address if you want to unsubscribe."
  ].filter(Boolean).join("\n");
}

function htmlMessage_(update,name){
  const greeting=name?`Hello ${escape_(name)},<br><br>`:"Hello,<br><br>";
  return greeting+escape_(message_(update)).replace(/\n/g,"<br>");
}

function truthy_(value){return value===true||["true","yes","y","1","x"].includes(String(value).toLowerCase().trim());}
function property_(name){const value=PropertiesService.getScriptProperties().getProperty(name);if(!value)throw new Error(`Missing Script Property: ${name}`);return value;}
function escape_(value){return String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));}
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
