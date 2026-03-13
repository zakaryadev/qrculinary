import * as fs from 'fs';
const content = fs.readFileSync('lib/types.ts', 'utf8');
const testScript = content + '\n\ntype DBTables = Database["public"]["Tables"];\nlet x: DBTables["analytics_events"]["Row"]["event_type"] = "qr_scan";\n';
fs.writeFileSync('dbcheck.ts', testScript);
