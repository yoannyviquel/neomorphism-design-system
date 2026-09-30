/**
 * Les deux filtres SVG des graphiques.
 *
 * Le DS ne dessine pas de graphique — recharts, ou du SVG à la main, s'en charge —, mais il en
 * règle le relief : sans cela chaque app réinvente son ombre, et un graphique est justement le cas
 * que la règle ne couvre pas, n'étant ni une commande ni une zone. Deux emplois, et aucun autre :
 *
 *   #ds-chart-groove — LA RAINURE D'UNE COURBE, et le choix par défaut pour un trait. Le creux du
 *     DS, RETOURNÉ : l'ombre du côté d'où vient la lumière, le rehaut du côté opposé. Un creux se
 *     loge dans une surface, où il range ses deux ombres internes ; un trait n'a pas d'intérieur où
 *     les ranger, alors la rainure les met dehors, de part et d'autre. Le trait cesse ainsi de
 *     flotter au-dessus de la page : il y est entaillé, comme une image l'est dans son chaton.
 *
 *     L'échelle se lit sur la largeur du trait : LE FLOU VAUT LA LARGEUR DU TRAIT. Le flou du creux
 *     vaut 48 k, donc k = largeur / 48 — 1/24 pour un trait de 2 px, 1/48 pour 1 px, 1/12 pour 4 px.
 *     Les trois donnent la même image à l'échelle près. Un cran au-dessus, les parois sortent du
 *     trait et redeviennent deux courbes fantômes ; un cran en dessous, elles y rentrent et
 *     s'éteignent. Le filtre ci-dessous est réglé pour les 2 px d'usage ; une autre largeur demande
 *     son propre filtre, sur la même règle.
 *
 *     Une SEULE série par graphique : deux rainures qui se croisent se brouillent au croisement.
 *
 *     EN THÈME CLAIR, la paroi éclairée ne se voit pas : la surface étant déjà presque blanche, il
 *     n'y a pas de place au-dessus d'elle. C'est la paroi à l'ombre qui porte seule, et c'est son
 *     SENS qui dit la rainure — au-dessus du trait, du côté d'où vient la lumière, quand l'ombre
 *     d'un objet posé tombe en dessous. La gravure et le relief se distinguent ainsi sur le papier,
 *     où la lumière est unique et le blanc indépassable.
 *
 *   #ds-chart-shadow — L'OMBRE D'UNE DONNÉE, que la rainure a remplacée pour les courbes ; gardée
 *     pour ce qui doit rester posé sur la page plutôt qu'entaillé dedans. L'ombre du relief à
 *     k = 1/9, l'échelle des plus petits éléments, posée sur un trait de 2 px. Au-delà de 1/4 elle
 *     s'en détache et se donne pour une seconde courbe, plus pâle et décalée ; en dessous de 1/9 il
 *     n'en reste rien.
 *
 *   #ds-chart-set — LE SERTISSAGE D'UN GRAPHIQUE. L'ombre du creux SEULE, à k = 1/3, l'échelle
 *     d'une surface : pas de reflet clair, pas de rebord. C'est le chaton d'une image sertie
 *     (`.ds-well`) porté à la taille d'un graphique, et pour la même raison — un reflet clair posé
 *     sur une surface colorée la voile, surtout en thème clair. Il loge le graphique entier, jamais
 *     une part isolée.
 *
 * Les valeurs sont en unités de tracé, qui sont les pixels de l'écran dans un graphique rendu à
 * l'échelle 1 (recharts). Les couleurs viennent du thème (`chart.css`) et non des attributs : un
 * attribut de présentation ne résout pas `var()`.
 *
 * À rendre UNE FOIS par page — les identifiants sont fixes —, puis à citer depuis n'importe quel
 * SVG : `filter="url(#ds-chart-groove)"`. En ATTRIBUT de préférence, et non par une règle CSS :
 * WebKit résout le fragment d'un `url(#…)` écrit dans une feuille séparée contre l'URL de la
 * feuille et non contre celle du document, et le filtre disparaît alors sans la moindre erreur.
 */
export function ChartFilters() {
  return (
    <svg className="ds-chart-filters" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {/* Rainure à k = 1/24, sur le modèle du CREUX (26 / 48 et 31 / 43) et sans rien y changer :
            48 × 1/24 = 2 px de flou, soit la largeur du trait — c'est toute la règle. Les décalages
            sont négatifs pour l'ombre et positifs pour le rehaut, l'inverse d'un relief. */}
        <filter id="ds-chart-groove" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            className="ds-groove-dark"
            in="SourceGraphic"
            dx="-1.08"
            dy="-1.08"
            stdDeviation="1"
            result="paroiSombre"
          />
          <feDropShadow
            className="ds-groove-light"
            in="SourceGraphic"
            dx="1.29"
            dy="1.29"
            stdDeviation="0.9"
            result="paroiClaire"
          />
          {/* La paroi claire dessous, la sombre par-dessus, le tracé au-dessus des deux : l'ordre
              d'une liste de box-shadow, et il garantit que rien ne passe devant la donnée. */}
          <feMerge>
            <feMergeNode in="paroiClaire" />
            <feMergeNode in="paroiSombre" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Relief à k = 1/9 : 28 et 50 réduits — 3,11 px de décalage, 5,56 px de flou (σ = flou / 2). */}
        <filter id="ds-chart-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="3.11" dy="3.11" stdDeviation="2.78" />
        </filter>

        {/* Creux à k = 1/3 : 26 et 48 réduits — 8,67 px de décalage, 16 px de flou. L'ombre est
            découpée dans la forme (composite « out ») puis reposée dessus : elle mord ses bords
            sans rien couvrir d'autre. */}
        <filter id="ds-chart-set" x="-40%" y="-40%" width="180%" height="180%">
          <feOffset in="SourceAlpha" dx="8.67" dy="8.67" result="decale" />
          <feGaussianBlur in="decale" stdDeviation="8" result="flou" />
          <feComposite operator="out" in="SourceAlpha" in2="flou" result="bord" />
          <feFlood result="encre" />
          <feComposite operator="in" in="encre" in2="bord" result="ombre" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="ombre" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
