// Explicit deployment origins only; never trust a client Origin as authorization.
export function allowedOrigin(request,env){
 const origin=request.headers.get('origin');
 return !!origin&&[env.PUBLIC_ORIGIN,...String(env.PUBLIC_ORIGINS||'').split(',')].filter(Boolean).map(s=>s.trim()).includes(origin);
}
