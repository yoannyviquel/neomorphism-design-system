import {
  Children,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
  type RefObject,
} from 'react'
import { cx } from './cx'

type Props<E extends HTMLElement> = HTMLAttributes<E> & { ref?: Ref<E> }

/** L'écran d'une app : l'en-tête, le corps qui défile, le pied, en colonne sur toute la hauteur. */
export function Screen({ className, ...rest }: Props<HTMLDivElement>) {
  return <div className={cx('ds-screen', className)} {...rest} />
}

/** L'en-tête fixe (une barre de recherche…), sous la barre d'état. */
export function Header({ className, ...rest }: Props<HTMLElement>) {
  return <header className={cx('ds-header', className)} {...rest} />
}

/**
 * Le corps, seul à défiler, entre l'en-tête et le pied : il passe sous eux en s'effaçant en fondu.
 * Sans en-tête, il prend lui-même la marge du haut, sous la barre d'état.
 *
 * IL NE COUPE QUE CE QU'IL DOIT. Un corps qui défile se coupe net sur ses bords — sans quoi son
 * contenu passerait par-dessus l'en-tête et le pied. Mais ce découpage n'a rien à cacher quand il
 * NE DÉFILE PAS : il ne coupe plus alors que les OMBRES de ce qu'il porte, et un bouton posé au ras
 * du pied y perdait la sienne, tranchée sur la ligne du pied. Le corps le dit donc par `data-fits`,
 * et la feuille de style en tire les conséquences (cf. `layout.css`) : plus de découpe, et
 * l'en-tête comme le pied rendent leur fond opaque, qui repeindrait par-dessus l'ombre.
 *
 * Il faut le MESURER : aucune requête CSS ne sait dire si une boîte défile (il faudrait
 * `scroll-state()`, que Safari ne connaît pas encore). On suit la boîte ET ses enfants — le corps
 * tient sa taille de l'écran, elle ne bouge pas quand son contenu grandit ; c'est le contenu qui
 * déborde. Au premier rendu on suppose qu'il défile : une ombre qui apparaît une image plus tard ne
 * se voit pas, un contenu qui déborde du cadre le temps d'une image, si.
 */
export function Body({ className, ref, ...rest }: Props<HTMLDivElement>) {
  const own = useRef<HTMLDivElement | null>(null)
  const [fits, setFits] = useState(false)

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      own.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as RefObject<HTMLDivElement | null>).current = node
    },
    [ref],
  )

  // Sans tableau de dépendances : les enfants observés changent avec le rendu.
  useLayoutEffect(() => {
    const body = own.current
    if (!body) return
    // Un pixel de garde : une hauteur de contenu fractionnaire dépasse la hauteur arrondie de la
    // boîte sans que rien ne défile pour autant.
    const measure = () => setFits(body.scrollHeight <= body.clientHeight + 1)
    measure()
    if (typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    for (const child of body.children) observer.observe(child)
    return () => observer.disconnect()
  })

  return <div ref={attach} data-fits={fits ? '' : undefined} className={cx('ds-body', className)} {...rest} />
}

/** Le pied fixe (la barre de menu), au-dessus de la zone sûre du bas d'iPhone. */
export function Footer({ className, ...rest }: Props<HTMLElement>) {
  return <footer className={cx('ds-footer', className)} {...rest} />
}

/** Durée du glissement d'un écran à l'autre : celle de la pastille du menu qui s'étire vers la
 *  nouvelle destination (`MENU_STRETCH_MS`) — les deux racontent le même geste, au même rythme. */
export const SLIDE_MS = 380

/**
 * Les écrans d'une app, CÔTE À CÔTE : changer de destination fait GLISSER le ruban, vers la
 * gauche ou vers la droite selon l'ordre des écrans — l'ordre de la barre de menu. Le mouvement
 * dit donc où l'on va, pas seulement qu'on a changé.
 *
 * Tous les écrans restent MONTÉS : une carte garde son contexte, une liste sa position de
 * défilement, et le passage de l'un à l'autre ne coûte rien. Seul l'écran courant est atteignable
 * — les autres sont `inert` : ni doigt, ni focus, ni lecteur d'écran, sans quoi leurs commandes
 * apparaîtraient en double dans l'ordre de tabulation.
 *
 * `at` est l'INDEX de l'écran courant : c'est au consommateur de le tenir (un store de vue, une
 * route), et il doit suivre l'ordre des enfants.
 */
export function Slides({ at, className, children, ...rest }: Props<HTMLDivElement> & { at: number }) {
  const screens = Children.toArray(children)
  const shown = Math.max(0, Math.min(screens.length - 1, at))
  return (
    <div className={cx('ds-slides', className)} {...rest}>
      <div className="ds-slides-track" style={{ '--slides-at': shown } as CSSProperties}>
        {screens.map((screen, index) => (
          <div key={index} className="ds-slide" inert={index !== shown}>
            {screen}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Une rangée de commandes qui OCCUPE SA LARGEUR : la place libre se répartit à parts égales entre
 * les boutons et aux deux bouts, au lieu de les serrer au centre derrière un écart fixe. L'écart
 * devient une mesure du conteneur — la même rangée respire sur un iPad et se resserre sur un
 * iPhone SE, sans réglage. En dessous de la place nécessaire, l'écart tombe à son minimum (la
 * marge des ombres) puis la rangée se replie.
 *
 * Elle NE POSE PAS de marge latérale : celle de son conteneur (le pied, le corps) suffit, et
 * `space-evenly` laisse déjà de la place aux deux bouts.
 *
 * `label` en fait un groupe nommé pour les lecteurs d'écran (« Commandes de la vue », « Catégories ») ;
 * sans lui, ce n'est qu'une boîte, et ce sont les boutons qui se nomment.
 */
export function ButtonBar({ label, className, ...rest }: Props<HTMLDivElement> & { label?: string }) {
  return <div role={label ? 'group' : undefined} aria-label={label} className={cx('ds-button-bar', className)} {...rest} />
}
