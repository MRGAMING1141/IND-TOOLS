/**
 * Utility for generating deterministic, memorable Special UIDs (IND-XXXX-XXXX)
 * and resolving user identifiers (Special UID, Auth UID, or Email).
 */

export function generateSpecialUid(uid: string): string {
  if (!uid) return 'IND-0000-0000';
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ (char * 31);
  }
  const part1 = (Math.abs(hash1) % 0xffff).toString(16).padStart(4, '0').toUpperCase();
  const part2 = (Math.abs(hash2) % 0xffff).toString(16).padStart(4, '0').toUpperCase();
  return `IND-${part1}-${part2}`;
}

export function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return 'Never logged in';
  let millis: number = 0;
  if (typeof timestamp === 'number') {
    millis = timestamp;
  } else if (timestamp?.toMillis) {
    millis = timestamp.toMillis();
  } else if (timestamp?.seconds) {
    millis = timestamp.seconds * 1000;
  } else if (timestamp instanceof Date) {
    millis = timestamp.getTime();
  } else {
    const parsed = new Date(timestamp).getTime();
    if (!isNaN(parsed)) millis = parsed;
  }

  if (!millis) return 'Unknown';

  const diffSec = Math.floor((Date.now() - millis) / 1000);
  if (diffSec < 5) return 'Just now (Active)';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
}
