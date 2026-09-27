/** Assemble des noms de classes, en écartant les valeurs fausses. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ')
}
