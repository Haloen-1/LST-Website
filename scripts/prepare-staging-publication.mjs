import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {recoverSnapshot} from './recover-snapshot.mjs';
import {allPhotos} from '../src/collections.mjs';
import {checkStaging} from './check-staging.mjs';

// Seed ONLY from the checked-in public capture, never from a database draft.
// Re-running a deployment must not overwrite content published by an editor.
export function stagingPublicationSQL(directory='published-snapshot'){
 const {content}=recoverSnapshot(directory);
 if(allPhotos(content).some(photo=>photo.src.startsWith('/media/')))throw Error('Snapshot needs KV photo restoration; review and restore those uploads before enabling this workflow.');
 const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
 const json=quote(JSON.stringify(content)),now=quote(new Date().toISOString());
 return `INSERT INTO site_content (id,draft_content,published_content,revision,updated_at,published_at)
VALUES ('site',${json},${json},1,${now},${now})
ON CONFLICT(id) DO UPDATE SET published_content=excluded.published_content,
published_at=excluded.published_at, revision=site_content.revision+1
WHERE site_content.published_content IS NULL;\n`;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const config=JSON.parse(fs.readFileSync('wrangler.github.json','utf8'));
 const failures=checkStaging(config);
 if(failures.length||config.vars.ADMIN_DISABLED!=='true')throw Error('GitHub staging must pass the staging guard with the admin locked. '+failures.join(' '));
 fs.mkdirSync('.migration-output',{recursive:true});
 fs.writeFileSync('.migration-output/staging-publication.sql',stagingPublicationSQL());
 console.log('Prepared public snapshot seed; existing publication and private drafts will be preserved. No database modified.');
}
