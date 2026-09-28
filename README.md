# Neomorphism design system

Le design system néomorphique de mes apps (Follow, Investment, weather-ahead) : les jetons, le CSS
et les composants React, avec une page de démonstration. Publié en privé sur GitHub Packages sous
`@yoannyviquel/neomorphism-design-system`.

## Principes

- **Deux niveaux, deux thèmes.** Au repos, une commande est en relief ; active (pressée, cochée,
  engagée), elle est enfoncée. Le thème suit l'appareil (sombre par défaut) ; `data-theme="dark"`
  ou `"light"` sur `<html>` le force.
- **L'ombre ne dit que l'interaction.** Ce qui se presse a du relief ; une **zone** (panneau,
  liste, message) n'a qu'une bordure fine.
- **Une échelle d'ombres.** Toutes les ombres réduisent la maquette (shadow 2 en relief, shadow 4 en
  creux) d'un facteur k : **1/3** pour les commandes ordinaires, **1/2** pour les grandes (barre de
  menu, recherche), **1/9** pour les creux fixes (le chaton d'un bouton serti). Marge autour d'une
  commande : **72 px × k** (24 px, 36 px). Un élément enfoncé garde son rebord : son ombre en relief.
- **Le rebond.** Les boutons s'enfoncent et se relâchent avec la courbe réglée dans l'atelier « Pop
  du bouton » (`--sink-ease`) : dépassement ×1,8, creux, second rebond, posé, en 1 s. Les
  animations passent par des nombres enregistrés (`@property --sink`, `--pop`, `--menu-at`) :
  Safari n'interpole pas des listes d'ombres écrites en variables.
- **Une hauteur** : 50 px pour tout — commandes (bouton, lien d'action, bouton-icône, champ,
  sélecteur, logo et nom), cadres qui en contiennent (recherche, barre de menu, où la commande fait
  34 px à 8 px de marge), tuiles à image (carrés de 50) — `--control-height`, `--control-height-lg`,
  `--control-inner`.
- **Un rayon** : 14 px, celui des boutons-icônes, pour tout ce qui fait la hauteur d'une commande
  (cadres de la recherche et du menu compris) ; 6 px pour ce qui y est logé, à 8 px du bord
  (`--control-radius`, `--control-radius-inner`).
- **Un toucher bref se voit** : le bouton reste enfoncé jusqu'au premier sommet du rebond (280 ms),
  puis se relâche avec le sien (`usePress`, classe `ds-pressed`).
- **L'ombre d'un bouton est un élément** (`<span class="ds-shade">`, rendu par les composants ;
  `Shade` pour un bouton écrit à la main), pas un pseudo-élément : il hérite des nombres animés du
  bouton, ce que Safari ne fait pas pour `::after`.
- **Les images ne remplacent jamais la surface d'un bouton.** Elles en sont le contenu, posées
  au-dessus de ses ombres : pastille, sertie, logo et nom, ou logo serti et nom.

## Contenu

| Composant | Rôle |
| --- | --- |
| `Button`, `IconButton` | bouton à libellé (tons défaut, primaire, danger, lien) et bouton-icône |
| `ImageButton` | bouton à image : `chip` (pastille), `set` (sertie), `label` (logo et nom), `label-set` (logo serti et nom) |
| `Input`, `Select`, `Checkbox` | champs, en relief au repos, creusés engagés |
| `SearchField` | champ de recherche, loupe qui s'allume, bouton Effacer |
| `MenuBar` | barre de menu creusée, pastille qui glisse sous la destination courante |
| `FoldingGrid` | grille repliée à une ligne, dépliée ligne par ligne avec le pop des boutons |
| `Spinner`, `Notice`, `Zone`, `Icon` | chargement, message, zone bordée, icônes (Symbols Nerd Font) |

## Utiliser le paquet dans une app

1. Un jeton GitHub (classic) avec le droit `read:packages`, dans l'environnement : `NODE_AUTH_TOKEN`.
2. Un `.npmrc` à la racine de l'app :

   ```
   @yoannyviquel:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```

3. `npm install @yoannyviquel/neomorphism-design-system`, puis :

   ```tsx
   import '@yoannyviquel/neomorphism-design-system/styles.css'
   import { Button, FoldingGrid, ImageButton } from '@yoannyviquel/neomorphism-design-system'
   ```

Le build d'une app (Cloudflare, CI) a besoin du même `NODE_AUTH_TOKEN` dans ses variables.

## Développer

```bash
npm install          # npm 11 (npm 10 bute sur la résolution des dépendances pair)
npm run site         # la page de démonstration, http://localhost:5173
npm test
npm run build        # dist/index.js, dist/types, dist/styles
```

## Page de démonstration

`site/` est une app Vite toute simple, bâtie sur les composants du paquet : chaque famille en
situation, avec un sélecteur de thème (appareil, sombre, clair). Pas de Storybook : sur iPhone,
Safari n'y jouait pas les animations (rebond, pop), alors qu'une page ordinaire les joue, comme
les apps.

Un Worker Cloudflare la sert (`wrangler.jsonc`), déployée à chaque poussée sur `main` par
l'intégration Git de Cloudflare :

| Réglage du build | Valeur |
| --- | --- |
| Commande de build | `npm run build-site` |
| Commande de déploiement | `npx wrangler deploy` |

Le build de ce Worker n'a besoin d'aucun jeton. L'adresse `*.workers.dev` est publique : pour
garder la page privée, la protéger par Cloudflare Access (Zero Trust → Access → Applications,
une règle sur son adresse e-mail).

## Publier une version

```bash
npm version minor    # ou patch, major : met à jour package.json et crée le tag
git push --follow-tags
```

Le workflow « Publier » construit et publie le tag sur GitHub Packages. Il se lance aussi à la main
(onglet Actions, « Run workflow ») et publie alors la version inscrite dans `package.json`.
