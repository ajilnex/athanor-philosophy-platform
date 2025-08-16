import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseTags(tagsString: string | null): string[] {
  if (!tagsString) return []
  try {
    const parsed = JSON.parse(tagsString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
