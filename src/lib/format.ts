/** Accord simple du pluriel français : « 0 unité », « 1 unité », « 18 unités ». */
export function plural(count: number, word: string): string {
  return `${count} ${Math.abs(count) >= 2 ? `${word}s` : word}`;
}
