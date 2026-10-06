import { useLayoutEffect, useRef, type ComponentProps, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'

/** Champ de saisie : en relief au repos, creusé au focus, avec le rebond du DS. */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('ds-input', className)} {...rest} />
}

export type TextAreaProps = ComponentProps<'textarea'>

/**
 * Ajuste la hauteur du champ à son texte. La remise à `auto` AVANT la mesure n'est pas un détail :
 * `scrollHeight` d'un champ déjà agrandi vaut sa hauteur courante, et le champ ne redescendrait
 * jamais après une suppression.
 */
function fitToText(element: HTMLTextAreaElement) {
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

/**
 * Champ de saisie MULTILIGNE : une ligne au repos — à la hauteur d'une commande, comme un `Input` —
 * puis il grandit avec le texte. Même relief, même creusé au focus.
 *
 * LA CROISSANCE EST DANS LE PAQUET, pas laissée aux apps. Elle ne tient qu'en trois lignes, mais ce
 * sont trois lignes à piège (la remise à `auto`, le cas non contrôlé, la mesure avant peinture) que
 * chaque app réécrirait — et réécrirait de travers : le champ fait maison qui a motivé ce composant
 * avait déjà perdu la hauteur de commande en chemin. Un habillage sans la croissance n'aurait rien
 * réglé.
 *
 * Deux déclencheurs, parce qu'un seul laisse un trou : `onInput` pour la frappe d'un champ NON
 * contrôlé (qui ne provoque aucun rendu), l'effet de mise en page après CHAQUE rendu pour un champ
 * contrôlé et pour les changements programmés — le vidage après envoi, typiquement, qui doit faire
 * redescendre le champ.
 *
 * Le PLAFOND de hauteur reste à l'app : qu'elle pose un `max-height`, le champ défilera.
 */
export function TextArea({ ref, className, onInput, ...rest }: TextAreaProps) {
  const field = useRef<HTMLTextAreaElement>(null)

  // `useLayoutEffect` et non `useEffect` : mesurer et redimensionner AVANT la peinture, sinon le
  // champ s'affiche une image à l'ancienne hauteur et sautille à chaque caractère.
  useLayoutEffect(() => {
    if (field.current !== null) fitToText(field.current)
  })

  return (
    <textarea
      ref={(node) => {
        field.current = node
        // La ref de l'app est servie en plus de la nôtre : sans elle, impossible d'y poser une
        // sélection (barre d'outils de mise en forme) ou de lui rendre le focus.
        if (typeof ref === 'function') ref(node)
        else if (ref !== null && ref !== undefined) ref.current = node
      }}
      rows={1}
      className={cx('ds-input', 'ds-textarea', className)}
      onInput={(event) => {
        fitToText(event.currentTarget)
        onInput?.(event)
      }}
      {...rest}
    />
  )
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
