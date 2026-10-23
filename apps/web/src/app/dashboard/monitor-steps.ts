export function monitorStepsPatch(protectedSteps: boolean, replaceSteps: boolean, text: string): { steps?: unknown } {
  if (protectedSteps && !replaceSteps) return {};
  const steps: unknown = JSON.parse(text);
  if (!Array.isArray(steps) || steps.length === 0 || steps.length > 5) throw new Error("Provide one to five API steps");
  return { steps };
}
