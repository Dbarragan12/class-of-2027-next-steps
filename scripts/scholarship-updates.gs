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

function setupFormTrigger(){
  const book=SpreadsheetApp.openById(property_("SUBSCRIBER_SHEET_ID"));
  const exists=ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==="copySubscriberFromForm");
  if (!exists) ScriptApp.newTrigger("copySubscriberFromForm").forSpreadsheet(book).onFormSubmit().create();
}

function copySubscriberFromForm(event){
  const values=event.namedValues||{};
  const email=firstValue_(values,["email address","email"]);
  const name=firstValue_(values,["name"]);
  const action=firstValue_(values,["what would you like","action"]);
  const consent=firstValue_(values,["agree","consent","permission"]);
  if (!email) return;

  const book=SpreadsheetApp.openById(property_("SUBSCRIBER_SHEET_ID"));
  const subscribers=book.getSheetByName(SHEET_NAMES.subscribers);
  const normalized=String(email).trim().toLowerCase();
  const rows=subscribers.getLastRow()>1?subscribers.getRange(2,1,subscribers.getLastRow()-1,6).getValues():[];
  const rowIndex=rows.findIndex(row=>String(row[0]).trim().toLowerCase()===normalized);
  const sheetRow=rowIndex<0?0:rowIndex+2;
  if (String(action).toLowerCase().includes("unsubscribe")) {
    if (sheetRow) subscribers.getRange(sheetRow,4).setValue(true);
    else subscribers.appendRow([String(email).trim(),name||"",false,true,new Date(),""]);
    return;
  }
  if (!consented_(consent)) return;
  if (sheetRow) {
    subscribers.getRange(sheetRow,2).setValue(name||rows[rowIndex][1]||"");
    subscribers.getRange(sheetRow,3,1,2).setValues([[true,false]]);
  } else {
    subscribers.appendRow([String(email).trim(),name||"",true,false,new Date(),""]);
  }
}

function sendUpdates_(updates){
  const book=SpreadsheetApp.openById(property_("SUBSCRIBER_SHEET_ID"));
  const subscribers=book.getSheetByName(SHEET_NAMES.subscribers);
  const sent=book.getSheetByName(SHEET_NAMES.sent);
  if (!subscribers||!sent) throw new Error("Run setupTabs() before sending updates.");
  const preferencesUrl=book.getFormUrl()||"";

  const sentIds=new Set(sent.getLastRow()>1?sent.getRange(2,1,sent.getLastRow()-1,1).getValues().flat().map(String):[]);
  const rows=subscribers.getLastRow()>1?subscribers.getRange(2,1,subscribers.getLastRow()-1,6).getValues():[];
  let recipients=0,skipped=0;
  for (const update of updates) {
    if (!update.id||sentIds.has(String(update.id))) { skipped++; continue; }
    const subject=`Scholarship update: ${update.name}`;
    const body=message_(update,preferencesUrl);
    for (let index=0;index<rows.length;index++) {
      const [email,name,optedIn,unsubscribed]=rows[index];
      if (!email||!truthy_(optedIn)||truthy_(unsubscribed)) continue;
      MailApp.sendEmail({to:String(email),subject,body,htmlBody:htmlMessage_(update,name,preferencesUrl)});
      subscribers.getRange(index+2,6).setValue(new Date());
      recipients++;
    }
    sent.appendRow([update.id,new Date(),update.name||""]);
    sentIds.add(String(update.id));
  }
  return {recipients,skipped};
}

function sendTestEmail(){
  const book=SpreadsheetApp.openById(property_("SUBSCRIBER_SHEET_ID"));
  const subscribers=book.getSheetByName(SHEET_NAMES.subscribers);
  const rows=subscribers.getLastRow()>1?subscribers.getRange(2,1,subscribers.getLastRow()-1,6).getValues():[];
  const preferencesUrl=book.getFormUrl()||"";
  const subject="Test: Toppenish scholarship updates";
  const body=[
    "This is a test of the Toppenish Scholarship Finder email updates.",
    "",
    "If you received this, confirmed scholarship alerts are working.",
    preferencesUrl?`Update your subscription or unsubscribe: ${preferencesUrl}`:""
  ].filter(Boolean).join("\n");
  let recipients=0;
  rows.forEach(([email,name,optedIn,unsubscribed])=>{
    if (!email||!truthy_(optedIn)||truthy_(unsubscribed)) return;
    MailApp.sendEmail({to:String(email),subject,body,htmlBody:htmlMessage_({name:"Email update test",organization:"Toppenish Scholarship Finder",award:"Test message",eligibility:"This is only a delivery test.",url:preferencesUrl},name,preferencesUrl)});
    recipients++;
  });
  console.log(`Test email sent to ${recipients} subscribed address(es).`);
}

function message_(update,preferencesUrl){
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
    preferencesUrl?`Update your subscription or unsubscribe: ${preferencesUrl}`:"Update your subscription or unsubscribe using the scholarship updates form."
  ].filter(Boolean).join("\n");
}

function htmlMessage_(update,name,preferencesUrl){
  const greeting=name?`Hello ${escape_(name)},<br><br>`:"Hello,<br><br>";
  return greeting+escape_(message_(update,preferencesUrl)).replace(/\n/g,"<br>");
}

function firstValue_(namedValues,terms){
  const entry=Object.entries(namedValues).find(([key])=>terms.some(term=>key.toLowerCase().includes(term)));
  return entry&&entry[1]?entry[1][0]:"";
}
function consented_(value){const text=String(value||"").toLowerCase();return text.includes("agree")||text.includes("yes")||text.includes("true")||text==="1"||text==="x";}
function truthy_(value){return value===true||["true","yes","y","1","x"].includes(String(value).toLowerCase().trim());}
function property_(name){const value=PropertiesService.getScriptProperties().getProperty(name);if(!value)throw new Error(`Missing Script Property: ${name}`);return value;}
function escape_(value){return String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));}
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
