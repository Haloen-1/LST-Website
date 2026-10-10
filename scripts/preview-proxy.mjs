// Local-only preview harness. Not part of the deployed Worker or public assets.
import http from 'node:http';
const email='owner@local.test';
http.createServer(async(req,res)=>{
 if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers.host!=='127.0.0.1:8765'){res.writeHead(403);res.end();return;}
 const headers={...req.headers,'oai-authenticated-user-id':'local-preview-owner','oai-authenticated-user-email':email};
 const forward=http.request('http://127.0.0.1:8787'+req.url,{method:req.method,headers},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
 forward.on('error',()=>{res.writeHead(503);res.end('Preview is starting. Please reload.');});req.pipe(forward);
}).listen(8765,'127.0.0.1',()=>console.log('Editor preview: http://127.0.0.1:8765/'));
