export function assertLocalTarget(value: string, role: string): void {
  try {
    const url = new URL(value);
    if (url.protocol !== 'postgresql:' || url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/watchtower_dev' || url.username !== role || url.search || url.hash) throw new Error();
  } catch {
    throw new Error('Expected local Watchtower database with the designated role; credentials omitted');
  }
}
