/**
 * Password hashing. Uses the Web Crypto SubtleCrypto SHA-256 implementation —
 * a reasonable browser-native one-way hash that avoids storing plaintext.
 * (The original build used a weak non-crypto hash; this is an upgrade.)
 */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
