/**
 * Les filtres SVG des graphiques.
 *
 * Le DS ne dessine pas de graphique — recharts, ou du SVG à la main, s'en charge —, mais il en
 * règle le relief : sans cela chaque app réinvente son ombre, et un graphique est justement le cas
 * que la règle ne couvre pas, n'étant ni une commande ni une zone.
 *
 * UNE MARQUE DE GRAPHIQUE EST ENTAILLÉE, POINT — qu'elle soit un trait, une aire, un symbole de
 * nuage, un rectangle de barre ou une part de camembert. Il n'y a pas à choisir, par marque, entre
 * être posé sur la page et y être gravé : toutes les marques d'un graphique disent la même chose,
 * elles doivent la dire de la même façon.
 *
 * ET À LA MÊME PROFONDEUR. C'est ce qui demande DEUX filtres plutôt qu'un, et le partage n'est pas
 * géométrique :
 *   — la GÉOMÉTRIE est la même pour tout (mêmes décalages, même flou), et c'est la marque la plus
 *     FINE du graphique qui la fixe : au-delà de sa largeur, les parois sortent de la marque et
 *     redeviennent deux courbes fantômes. Une rainure n'a donc qu'une profondeur par graphique ;
 *   — l'ENCRE, elle, compense ce que la marque PERD de son ombre. Une ombre portée est la
 *     silhouette décalée et floutée : une marque mince n'en dépose qu'une part, une marque pleine
 *     la dépose entière. Mesuré à rainure constante, l'ombre par pixel de bord rapportée à celle
 *     d'une marque épaisse : 1 px → 27 %, 2 px → 40 %, 3 px → 89 %, 6 px → 99 %, 9 px → 100 %.
 *     D'où deux encres, et un seuil à 3 px.
 *
 *   #ds-chart-groove — LA RAINURE D'UN TRAIT (1 à 2 px) : courbe, contour d'aire, ligne de
 *     référence. Encre dense (--neu-data / --neu-data-light), qui rend au trait les trois
 *     cinquièmes d'ombre que sa minceur lui coûte. Le creux du
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
 *     TOUTES les séries d'un graphique, et non la seule principale : le sillon n'est pas une mise
 *     en avant, c'est l'appartenance d'une donnée à la page. Une série qui y échapperait se
 *     donnerait pour autre chose qu'une donnée. Deux rainures qui se croisent se lisent sans peine —
 *     chacune garde la sienne, et ce sont la teinte et les tirets qui les distinguent ; elles ne se
 *     confondent un peu que là où deux traits courent côte à côte à moins d'un sillon d'écart.
 *
 *     EN THÈME CLAIR, la paroi éclairée ne se voit pas : la surface étant déjà presque blanche, il
 *     n'y a pas de place au-dessus d'elle. C'est la paroi à l'ombre qui porte seule, et c'est son
 *     SENS qui dit la rainure — au-dessus du trait, du côté d'où vient la lumière, quand l'ombre
 *     d'un objet posé tombe en dessous. La gravure et le relief se distinguent ainsi sur le papier,
 *     où la lumière est unique et le blanc indépassable.
 *
 *   #ds-chart-groove-fill — LA RAINURE D'UNE MARQUE PLEINE (3 px et plus) : symbole de nuage,
 *     rectangle de barre, part de camembert, aplat. MÊME géométrie, au pixel près — on ne recalcule
 *     pas une profondeur par marque, sinon une barre de 30 px porterait une entaille de 30 px à
 *     côté d'une courbe entaillée de 2, et les deux ne se compareraient plus. Ce qui change est
 *     l'ENCRE : --neu-data-fill / --neu-data-fill-light, soit les deux encres de trait à 40 %.
 *     Mesuré : sans cette correction, une barre dépose 2,4 fois l'ombre de la courbe voisine ; avec
 *     elle, exactement la sienne (rapport 1,00 pour 14 px comme pour 30 px, dans les deux thèmes).
 *     Un symbole ROND fait exception de quelques dixièmes — son bord n'est que courbure, et une
 *     courbure convexe étale son ombre sur plus de largeur qu'un bord droit (× 1,5 par pixel de
 *     bord). Ce n'est pas rattrapé : sa frange a la même largeur et un pic PLUS FAIBLE que celle
 *     d'une barre, elle ne se lit donc pas plus profonde, et une troisième encre par forme
 *     rouvrirait précisément l'échelle qu'on vient de fermer.
 *
 *   #ds-chart-shadow — L'OMBRE D'UNE DONNÉE. **DÉPRÉCIÉ** : il n'a plus d'emploi. Il servait à poser
 *     une marque SUR la page plutôt que dedans, et il n'y a plus de marque à poser — les deux
 *     rainures les prennent toutes. Conservé le temps que les apps qui le citent encore y passent,
 *     puis à retirer. L'ombre du relief à k = 1/9, l'échelle des plus petits éléments, posée sur un
 *     trait de 2 px. Au-delà de 1/4 elle s'en détache et se donne pour une seconde courbe, plus
 *     pâle et décalée ; en dessous de 1/9 il n'en reste rien.
 *
 *   #ds-chart-set — LE SERTISSAGE D'UN GRAPHIQUE. L'ombre du creux SEULE, à k = 1/3, l'échelle
 *     d'une surface : pas de reflet clair, pas de rebord. C'est le chaton d'une image sertie
 *     (`.ds-well`) porté à la taille d'un graphique, et pour la même raison — un reflet clair posé
 *     sur une surface colorée la voile, surtout en thème clair. Il loge le graphique ENTIER, jamais
 *     une marque : une part de camembert prend la rainure d'une marque pleine, comme une barre.
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

        {/* La MÊME rainure, pour une marque pleine : les décalages et les flous sont recopiés à
            l'identique du filtre ci-dessus — la gravure d'un graphique a UNE profondeur, et c'est
            la marque la plus fine qui la fixe. Seule l'ENCRE change (cf. chart.css), parce qu'une
            marque pleine retient toute son ombre là où un trait en perd les trois cinquièmes. */}
        <filter id="ds-chart-groove-fill" x="-40%" y="-40%" width="180%" height="180%">
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
          <feMerge>
            <feMergeNode in="paroiClaire" />
            <feMergeNode in="paroiSombre" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Relief à k = 1/9 : 28 et 50 réduits — 3,11 px de décalage, 5,56 px de flou (σ = flou / 2).
            DÉPRÉCIÉ : plus aucune marque ne s'en sert, les deux rainures les prennent toutes.
            Conservé le temps que les apps qui le citent encore y passent. */}
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
