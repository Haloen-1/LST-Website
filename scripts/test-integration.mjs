import {spawnSync} from 'node:child_process';
for(const file of ['tests/integration.mjs','tests/signup-integration.mjs','tests/cloudflare-integration.mjs','tests/forms-integration.mjs','tests/locked-staging-integration.mjs']){const result=spawnSync(process.execPath,[file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
