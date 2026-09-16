import { promises as dns } from "dns"

/**
 * List of known disposable / fake / temporary email domain providers.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "dispostable.com",
  "trashmail.com",
  "fakeinbox.com",
  "sharklasers.com",
  "yopmail.com",
  "getnada.com",
  "throwawaymail.com",
  "mytemp.email",
  "tempail.com",
  "crazymailing.com",
  "nada.ltd",
  "mohmal.com",
  "generator.email",
  "emailondeck.com",
  "byom.de",
  "chacuo.net",
  "inboxalias.com",
  "fake.com",
  "invalid.com",
])

/**
 * Strict RFC 5322 standard email format regex.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export interface EmailValidationResult {
  isValid: boolean
  reason?: string
}

/**
 * Validates whether an HR/Admin email is authentic, real, and has an active receiving domain.
 */
export async function validateAuthenticHrEmail(email: string): Promise<EmailValidationResult> {
  const normalized = (email || "").trim().toLowerCase()

  if (!normalized) {
    return { isValid: false, reason: "Email address is required." }
  }

  // 1. Syntax check
  if (!EMAIL_REGEX.test(normalized)) {
    return { isValid: false, reason: "Please enter a valid email address format (e.g. name@company.com)." }
  }

  const parts = normalized.split("@")
  if (parts.length !== 2) {
    return { isValid: false, reason: "Invalid email structure." }
  }

  const [localPart, domain] = parts

  if (localPart.length === 0 || domain.length < 4) {
    return { isValid: false, reason: "Email address or domain is too short." }
  }

  // 2. TLD check (must have valid extension like .com, .org, .net, .io, .dev, etc.)
  const domainParts = domain.split(".")
  const tld = domainParts[domainParts.length - 1]
  if (domainParts.length < 2 || !tld || tld.length < 2) {
    return { isValid: false, reason: "Email domain must include a valid top-level extension (e.g. .com, .org, .io)." }
  }

  // 3. Reject disposable/temporary domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { isValid: false, reason: "Disposable or temporary email providers are not permitted for HR accounts." }
  }

  // 4. DNS MX (Mail Exchange) record check
  // Verify that the domain actually exists on DNS and accepts mail
  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DNS timeout")), 3000)),
    ])

    if (!mxRecords || mxRecords.length === 0) {
      return { isValid: false, reason: `The email domain '${domain}' has no active mail servers and cannot receive email.` }
    }
  } catch (error: any) {
    // If DNS returns ENOTFOUND or ENODATA, domain does not exist or has no mail servers
    if (error?.code === "ENOTFOUND" || error?.code === "ENODATA") {
      return { isValid: false, reason: `The email domain '${domain}' does not exist or has no valid mail servers.` }
    }

    // In local development or network offline environments, fallback to A-record check
    try {
      const aRecords = await dns.resolve4(domain)
      if (!aRecords || aRecords.length === 0) {
        return { isValid: false, reason: `The domain '${domain}' could not be resolved.` }
      }
    } catch {
      // If network timeout in dev, allow non-disposable domain
      if (process.env.NODE_ENV !== "production" && (error?.message === "DNS timeout" || error?.code === "ECONNREFUSED")) {
        return { isValid: true }
      }
    }
  }

  return { isValid: true }
}
