/**
 * Les deux filtres SVG des graphiques.
 *
 * Le DS ne dessine pas de graphique — recharts, ou du SVG à la main, s'en charge —, mais il en
 * règle le relief : sans cela chaque app réinvente son ombre, et un graphique est justement le cas
 * que la règle ne couvre pas, n'étant ni une commande ni une zone. Deux emplois, et aucun autre :
 *
 *   #ds-chart-shadow — L'OMBRE D'UNE DONNÉE. L'ombre du relief à k = 1/9, l'échelle des plus
 *     petits éléments, posée sur un trait de 2 px. Au-delà de 1/4 elle s'en détache et se donne
 *     pour une seconde courbe, plus pâle et décalée ; en dessous de 1/9 il n'en reste rien.
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
 * SVG : `filter="url(#ds-chart-shadow)"`.
 */
export function ChartFilters() {
  return (
    <svg className="ds-chart-filters" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
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
