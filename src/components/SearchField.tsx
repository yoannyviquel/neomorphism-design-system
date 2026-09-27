import type { InputHTMLAttributes, Ref } from 'react'
import { IconButton } from './Button'
import { cx } from './cx'
import { Icon } from './Icon'

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string
  onChange: (value: string) => void
  /** Effacer : le bouton n'apparaît que s'il y a quelque chose à effacer. */
  onClear?: () => void
  clearLabel?: string
  inputRef?: Ref<HTMLInputElement>
}

/**
 * Champ de recherche : un cadre en relief, creusé quand on y écrit ; la loupe s'allume ; le bouton
 * Effacer y est en relief. `enterKeyHint="search"` met « Rechercher » sur la touche Entrée mobile.
 * Le nom accessible du champ vient d'un <label> de l'app ou de `aria-label`.
 */
export function SearchField({ value, onChange, onClear, clearLabel = 'Effacer la recherche', inputRef, className, ...rest }: SearchFieldProps) {
  return (
    <div className={cx('ds-search', className)}>
      <Icon name="magnify" className="ds-search-icon" />
      <input
        ref={inputRef}
        className="ds-search-input"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      />
      {onClear && value !== '' && <IconButton icon="close" label={clearLabel} large onClick={onClear} />}
    </div>
  )
}
