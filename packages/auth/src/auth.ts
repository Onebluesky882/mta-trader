import { SignJWT, jwtVerify } from 'jose'

export interface TokenPayload {
  userId: string
  role: string
}

const TOKEN_EXPIRY = '7d'

/**
 * Encode the raw secret string into a Uint8Array key for jose.
 * The secret must be supplied at call time — never hardcoded.
 */
function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

/**
 * Generate a signed JWT for the given user.
 *
 * @param userId - The user's ID
 * @param role   - The user's role (e.g. "owner", "user")
 * @param secret - The JWT_SECRET from the environment (never hardcoded)
 * @returns Signed JWT string
 */
export async function generateToken(
  userId: string,
  role: string,
  secret: string
): Promise<string> {
  const key = encodeSecret(secret)

  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(key)
}

/**
 * Verify a JWT and return the payload, or null if invalid / expired.
 *
 * @param token  - Bearer token from Authorization header
 * @param secret - The JWT_SECRET from the environment (never hardcoded)
 * @returns Decoded payload, or null
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<TokenPayload | null> {
  try {
    const key = encodeSecret(secret)
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })

    const userId = payload['userId']
    const role = payload['role']

    if (typeof userId !== 'string' || typeof role !== 'string') {
      return null
    }

    return { userId, role }
  } catch {
    return null
  }
}
