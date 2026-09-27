import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'

/** Champ de saisie : en relief au repos, creusé au focus, avec le rebond du DS. */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('ds-input', className)} {...rest} />
}

export interface SelectOption {
  value: string
  label: string
}

/** Sélecteur, sans habillage natif (Safari sur iPhone l'imposait, à plat), chevron du DS. */
export function Select({ options, className, ...rest }: { options: readonly SelectOption[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cx('ds-select', className)}>
      <select className="ds-input" {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name="chevron_down" className="ds-select-chevron" />
    </div>
  )
}

/** Case à cocher : relief au repos ; cochée, enfoncée, coche rétroéclairée. */
export function Checkbox({ className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="checkbox" className={cx('ds-checkbox', className)} {...rest} />
}
