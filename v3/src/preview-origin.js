// Used only by the isolated GitHub Codespaces local preview.
// Deploy configurations MUST NOT expose CODESPACES_PREVIEW_ORIGIN.
export function sameOrigin(request, env) {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get('Origin');
  if (origin === expected) return true;
  const preview = env?.APP_ENV === 'staging' && env?.AUTH_MODE === 'internal' &&
    env?.CODESPACES_PREVIEW === 'true' && env?.CODESPACES_PREVIEW_ORIGIN;
  if (!preview || !/^https:\/\/[a-z0-9-]+-8792\.app\.github\.dev$/.test(preview))
    return false;
  return origin === preview;
}
