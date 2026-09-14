/** Keep input and painting responsive between small batches of geometry work. */
export async function runBuildSteps<T>(
  steps: Generator<void, T, void>,
  signal?: AbortSignal,
): Promise<T> {
  try {
    for (;;) {
      signal?.throwIfAborted();
      const deadline = performance.now() + 8;
      let step: IteratorResult<void, T>;
      do {
        step = steps.next();
        if (step.done) return step.value;
      } while (performance.now() < deadline);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    steps.return(undefined as T);
  }
}

export function finishBuildSteps<T>(steps: Generator<void, T, void>): T {
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
  }
}
