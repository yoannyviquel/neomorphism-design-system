/** Les initiales d'un nom, deux au plus : ce qu'une image absente laisse voir. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
