/**
 * Le calque d'ombre d'un bouton du DS : relief au repos, creux enfoncé, rebond — il suit --sink et
 * --pop, qu'il hérite du bouton. Un élément, et non un pseudo-élément : Safari, sur iPhone, ne
 * répercutait pas ces nombres animés sur ::after. Tout bouton `.ds-button` en rend un.
 */
export function Shade() {
  return <span className="ds-shade" aria-hidden="true" />
}
