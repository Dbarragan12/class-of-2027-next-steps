import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateRoster } from "./lib/scholarship-source-updater.mjs";

const execFileAsync=promisify(execFile);
const file="data/scholarships.json";
const current=JSON.parse(await readFile(file,"utf8"));
const {stdout}=await execFileAsync("git",["show",`HEAD:${file}`]);
const previous=JSON.parse(stdout);
validateRoster(previous.scholarships,current.scholarships);
console.log(`Roster lock passed: ${current.scholarships.length} existing records, 0 added, 0 removed, 0 renamed.`);
