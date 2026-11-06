// Pages are public but locked down: no inline scripts or styles, no framing, no indexing.
const CSP="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";
export function secureAsset(response:Response):Response {
  const secured=new Response(response.body,response);
  secured.headers.set('Content-Security-Policy',CSP);
  secured.headers.set('X-Content-Type-Options','nosniff');
  secured.headers.set('Referrer-Policy','no-referrer');
  secured.headers.set('X-Robots-Tag','noindex, nofollow');
  return secured;
}
