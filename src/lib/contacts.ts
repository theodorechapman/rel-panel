import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Cache contact map to avoid frequent shell calls
let contactMap: Record<string, string> | null = null;

export async function getContactMap(): Promise<Record<string, string>> {
  if (contactMap) {
    return contactMap;
  }

  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'get_contacts.swift');
    // Run swift script
    const { stdout } = await execAsync(`swift "${scriptPath}"`);
    
    contactMap = JSON.parse(stdout);
    return contactMap || {};
  } catch (error) {
    console.error("Failed to fetch contacts via Swift script:", error);
    return {};
  }
}

export function normalizePhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
}

export function getContactName(phone: string, map: Record<string, string>): string | null {
    const normalized = normalizePhoneNumber(phone);
    
    // 1. Exact match
    if (map[normalized]) return map[normalized];
    
    // 2. Suffix match (e.g. stored as 1425..., input is +1425...)
    // Or stored as 425..., input is 1425...
    // Iterate keys is slow but safer if exact match fails. 
    // For performance, we can rely on exact normalization if we trust country codes.
    // Let's try simple suffix check
    
    // If normalized is longer (has country code), check if it ends with stored
    // This is tricky because map keys might not have country codes.
    
    for (const [storedNum, name] of Object.entries(map)) {
        if (normalized.endsWith(storedNum) || storedNum.endsWith(normalized)) {
             return name;
        }
    }
    
    return null;
}

