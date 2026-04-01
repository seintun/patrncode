export function isPrismaMissingTableError(error: unknown, modelName?: string): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybe = error as {
    code?: string;
    meta?: { modelName?: string };
  };

  if (maybe.code !== 'P2021') return false;
  if (!modelName) return true;
  return maybe.meta?.modelName === modelName;
}
