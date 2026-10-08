import { pinIdentity } from './editor-pin.js';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { isInternalStaging, stagingIdentity } from './staging-auth.js';
const keysets = new Map();
export async function identity(request, env) {
  const host = new URL(request.url).hostname;
  if (
    env.APP_ENV === 'local' &&
    env.LOCAL_TEST_AUTH === 'true' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(host)
  ) {
    const email =
      request.headers.get('X-Local-User') || 'calculator@local.test';
    return { email, local: true };
  }
  if (env.APP_ENV === 'production' && env.AUTH_MODE==='internal' &&
      env.PRODUCTION_PUBLIC_PIN==='true' && env.PUBLIC_CALCULATOR==='true' &&
      env.LOCAL_TEST_AUTH!=='true') {
    const editor=await pinIdentity(request,env);
    if(editor)return editor;
    throw Object.assign(Error('Sign in required'),{status:401});
  }
  if (isInternalStaging(env)) {
    // A named password+TOTP reviewer/admin session takes precedence over a PIN editor session.
    try {return await stagingIdentity(request,env);}
    catch(e) {if(e.status!==401)throw e;}
    const editor=await pinIdentity(request,env);
    if(editor)return editor;
    throw Object.assign(Error('Sign in required'),{status:401});
  }
  if (env.LOCAL_TEST_AUTH === 'true')
    throw Object.assign(
      Error(
        'Local authentication cannot run outside loopback local environment',
      ),
      { status: 503 },
    );
  if (
    !env.ACCESS_TEAM_DOMAIN?.endsWith('.cloudflareaccess.com') ||
    !env.ACCESS_AUD ||
    env.ACCESS_AUD.startsWith('REPLACE')
  )
    throw Object.assign(Error('Access configuration required'), {
      status: 503,
    });
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw Object.assign(Error('Sign in required'), { status: 401 });
  const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
  if (!keysets.has(issuer))
    keysets.set(
      issuer,
      createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)),
    );
  try {
    const { payload } = await jwtVerify(token, keysets.get(issuer), {
      issuer,
      audience: env.ACCESS_AUD,
      algorithms: ['RS256'],
    });
    if (
      !payload.email ||
      !payload.sub ||
      !payload.exp ||
      payload.type !== 'app'
    )
      throw Error('Invalid user token');
    return { email: String(payload.email).toLowerCase(), local: false };
  } catch {
    throw Object.assign(Error('Invalid or expired Access session'), {
      status: 401,
    });
  }
}
