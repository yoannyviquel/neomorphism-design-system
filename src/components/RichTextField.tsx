import { useLayoutEffect, useRef } from 'react'
import { IconButton } from './Button'
import { cx } from './cx'
import { TextArea, type TextAreaProps } from './Field'
import type { IconName } from './icons'

/**
 * CE QU'UN OUTIL SAIT FAIRE AU TEXTE. Deux gestes couvrent toute une barre de mise en forme :
 * entourer la sélection, ou préfixer les lignes qu'elle touche. Les deux respectent la sélection —
 * c'est la seule raison d'être de ce composant, et ce que chaque app refaisait de travers.
 */
export interface RichTextEditor {
  /**
   * Entoure la sélection de `before`/`after`. Sans sélection, le curseur se pose ENTRE les deux :
   * on clique « Gras » puis on tape, et le texte sort gras.
   *
   * `placeholder` déplace la sélection finale sur un gabarit posé dans `after` — le « url » de
   * `[texte](url)`, qu'on veut voir sélectionné pour le remplacer en tapant.
   */
  wrap: (before: string, after: string, placeholder?: string) => void
  /** Préfixe CHAQUE ligne touchée par la sélection (listes, citations, titres), pas la première. */
  prefixLines: (prefix: string) => void
}

/**
 * Un outil de la barre : son icône, son nom accessible, et ce qu'il écrit.
 *
 * `run` reçoit l'éditeur au lieu de décrire l'insertion en données : un outil qui demande plus que
 * `wrap` ou `prefixLines` (le lien et son gabarit, demain autre chose) s'écrit alors sans que le
 * descripteur ait à prévoir son cas. C'est l'échappatoire, et elle tient en un argument.
 */
export interface RichTextAction {
  icon: IconName
  label: string
  run: (editor: RichTextEditor) => void
}

/**
 * LE JEU PAR DÉFAUT EST DU MARKDOWN, parce que c'est la syntaxe que le DS peut connaître sans rien
 * savoir de personne. Une app dont l'outil parle autre chose (un wiki, un éditeur maison) passe le
 * sien par `actions` — le paquet n'embarque aucune syntaxe propriétaire, et n'a pas à en connaître.
 *
 * Il n'est pas exporté : le contrat est de le REMPLACER, pas de l'augmenter. Le jour où une app
 * voudra « le markdown plus un outil », ce sera le moment de l'ouvrir, pas avant.
 */
const MARKDOWN_ACTIONS: readonly RichTextAction[] = [
  { icon: 'format_bold', label: 'Gras', run: (editor) => editor.wrap('**', '**') },
  { icon: 'format_italic', label: 'Italique', run: (editor) => editor.wrap('_', '_') },
  { icon: 'format_strikethrough_variant', label: 'Barré', run: (editor) => editor.wrap('~~', '~~') },
  { icon: 'code_tags', label: 'Code', run: (editor) => editor.wrap('`', '`') },
  { icon: 'code_braces', label: 'Bloc de code', run: (editor) => editor.wrap('```\n', '\n```') },
  { icon: 'format_quote_close', label: 'Citation', run: (editor) => editor.prefixLines('> ') },
  { icon: 'format_list_bulleted', label: 'Liste à puces', run: (editor) => editor.prefixLines('- ') },
  { icon: 'format_list_numbered', label: 'Liste numérotée', run: (editor) => editor.prefixLines('1. ') },
  { icon: 'format_header_3', label: 'Titre', run: (editor) => editor.prefixLines('### ') },
  { icon: 'link_variant', label: 'Lien', run: (editor) => editor.wrap('[', '](url)', 'url') },
]

export interface RichTextFieldProps extends Omit<TextAreaProps, 'value' | 'onChange' | 'ref'> {
  value: string
  /** Le champ est CONTRÔLÉ : les outils réécrivent le texte, il faut bien que l'app le reçoive. */
  onChange: (value: string) => void
  /** Le jeu d'outils, à la place du markdown du paquet. */
  actions?: readonly RichTextAction[]
  toolbarLabel?: string
}

/**
 * Champ de saisie MULTILIGNE SURMONTÉ DE SA BARRE DE MISE EN FORME : le `TextArea` du paquet, sa
 * croissance comprise, et au-dessus les outils qui écrivent la syntaxe.
 *
 * LES OUTILS SONT DE VRAIES COMMANDES (`IconButton`) : en relief au repos, creusées au clic. Une
 * barre rendue à plat se lit comme du texte iconique, et on ne sait plus qu'on peut appuyer dessus.
 *
 * CE QUE LE PAQUET PORTE ICI, ce n'est pas l'habillage — c'est la MÉCANIQUE D'INSERTION, et elle est
 * pleine de pièges qu'aucune app ne doit retomber dedans : la sélection respectée (entourée, ou
 * chaque ligne préfixée), le focus gardé au clic (cf. `keepFocus`), la sélection replacée APRÈS le
 * rendu. Même raisonnement que la croissance automatique du `TextArea` : trois gestes courts, mais
 * faux dès qu'on les réécrit.
 */
export function RichTextField({ value, onChange, actions = MARKDOWN_ACTIONS, toolbarLabel = 'Mise en forme', className, ...rest }: RichTextFieldProps) {
  const field = useRef<HTMLTextAreaElement>(null)
  /**
   * La sélection à rétablir APRÈS le prochain rendu. Le champ est contrôlé : `onChange` ne met pas
   * `value` à jour tout de suite, et un `setSelectionRange` posé dans le gestionnaire de clic
   * porterait sur l'ANCIEN texte — le navigateur remettrait ensuite le curseur à la fin.
   */
  const pending = useRef<[number, number] | null>(null)

  // Avant la peinture, comme la mise à hauteur du `TextArea` : une sélection qui apparaît une image
  // plus tard se voit sauter.
  useLayoutEffect(() => {
    const selection = pending.current
    if (selection === null || field.current === null) return
    pending.current = null
    // Le focus revient au champ : on vient de cliquer un outil, et la suite de la phrase se tape
    // dans le champ, pas dans le bouton.
    field.current.focus()
    field.current.setSelectionRange(selection[0], selection[1])
  })

  const editor: RichTextEditor = {
    wrap: (before, after, placeholder) => {
      const element = field.current
      if (element === null) return
      // LA VALEUR VIVE DU CHAMP et non la prop `value` de ce rendu-ci : une action peut écrire après
      // un aller-retour (le marqueur d'une pièce jointe, typiquement), et ce qu'on a tapé pendant
      // serait écrasé par l'ancien texte capturé dans la fermeture.
      const { selectionStart: start, selectionEnd: end, value: current } = element
      const next = `${current.slice(0, start)}${before}${current.slice(start, end)}${after}${current.slice(end)}`
      if (placeholder === undefined) pending.current = [start + before.length, end + before.length]
      else {
        const anchor = next.indexOf(placeholder, end + before.length)
        pending.current = [anchor, anchor + placeholder.length]
      }
      onChange(next)
    },
    prefixLines: (prefix) => {
      const element = field.current
      if (element === null) return
      const { selectionStart: start, selectionEnd: end, value: current } = element
      // On remonte au début de la ligne où commence la sélection : préfixer au milieu d'une ligne
      // produirait « du tex- te », qui n'est une liste pour personne.
      const from = current.lastIndexOf('\n', start - 1) + 1
      const block = current.slice(from, end)
      const prefixed = block
        .split('\n')
        .map((line) => `${prefix}${line}`)
        .join('\n')
      pending.current = [from + prefix.length, end + (prefixed.length - block.length)]
      onChange(`${current.slice(0, from)}${prefixed}${current.slice(end)}`)
    },
  }

  return (
    <div className={cx('ds-rich', className)}>
      <div className="ds-button-bar ds-rich-toolbar" role="toolbar" aria-label={toolbarLabel}>
        {actions.map((action) => (
          <IconButton
            key={action.label}
            icon={action.icon}
            label={action.label}
            title={action.label}
            /**
             * UN CLIC D'OUTIL NE DOIT PAS SORTIR LE FOCUS DU CHAMP : sans ça, le champ est quitté
             * avant que l'action ne s'exécute, la sélection est perdue — et c'est justement elle
             * qu'on allait entourer. `preventDefault` au `mousedown` annule le déplacement du focus
             * à la source. Posé ici une fois pour toutes : une app qui fournit ses propres
             * `actions` l'a sans le savoir, et c'est bien tout l'intérêt.
             */
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => action.run(editor)}
          />
        ))}
      </div>
      <TextArea ref={field} value={value} onChange={(event) => onChange(event.target.value)} {...rest} />
    </div>
  )
}
