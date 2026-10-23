export function withDeadline<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise<T>((resolve,reject) => {
    const abort=() => reject(new Error('ABORTED'));
    signal.addEventListener('abort',abort,{once:true});
    work.then(resolve,reject).finally(() => signal.removeEventListener('abort',abort)).catch(() => {});
  });
}
