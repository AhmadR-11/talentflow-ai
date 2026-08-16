import crypto from "crypto"

export function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function createResetTokenExpiry() {
  return new Date(Date.now() + 1000 * 60 * 60)
}
