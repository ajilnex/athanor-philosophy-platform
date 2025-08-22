import { URL } from 'url'

// Configuration stricte des domaines autorisés
const ALLOWED_HOSTS = process.env.PDF_ALLOWED_HOSTS?.split(',') || [
  'res.cloudinary.com',
  'athanor-cdn.cloudinary.com',
]

const BLOCKED_PROTOCOLS = ['file:', 'ftp:', 'gopher:', 'telnet:', 'dict:']
const BLOCKED_PORTS = [22, 23, 25, 110, 143, 3306, 5432, 6379, 27017]
const PRIVATE_IP_RANGES = [
  /^127\./, // Loopback
  /^10\./, // Private Class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
  /^192\.168\./, // Private Class C
  /^169\.254\./, // Link-local
  /^::1$/, // IPv6 loopback
  /^fc00:/, // IPv6 private
  /^fe80:/, // IPv6 link-local
]

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validatePdfUrl(urlString: string): ValidationResult {
  try {
    const url = new URL(urlString)

    // 1. Vérifier le protocole
    if (url.protocol !== 'https:') {
      return {
        isValid: false,
        error: `Protocol ${url.protocol} not allowed. Only HTTPS is permitted.`,
      }
    }

    // 2. Vérifier l'hôte contre la whitelist
    if (!ALLOWED_HOSTS.includes(url.hostname)) {
      return {
        isValid: false,
        error: `Host ${url.hostname} not in allowed list`,
      }
    }

    // 3. Vérifier les ports
    const port = url.port ? parseInt(url.port) : 443
    if (BLOCKED_PORTS.includes(port)) {
      return {
        isValid: false,
        error: `Port ${port} is blocked`,
      }
    }

    // 4. Double vérification contre les IPs privées (résolution DNS)
    // Note: Nécessite une résolution DNS sécurisée en production

    // 5. Vérifier l'extension du fichier
    if (!url.pathname.toLowerCase().endsWith('.pdf')) {
      return {
        isValid: false,
        error: 'URL must point to a PDF file',
      }
    }

    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    }
  }
}

// Limites de sécurité supplémentaires
export const PDF_SECURITY_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  DOWNLOAD_TIMEOUT: 30000, // 30 secondes
  MAX_REDIRECTS: 3,
  MAX_PROCESSING_TIME: 60000, // 60 secondes total
}
