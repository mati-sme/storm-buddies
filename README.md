# Storm Buddies

Mobile-first cozy pixel ascent game. Ride a balloon up through sky layers with storm-kitten, pop clouds for scrap, and punch the storm ceiling for Relics that unlock new helpers.

## Play

Open `index.html` locally, or use the GitHub Pages URL after deploy.

```bash
python3 -m http.server -d /workspace/projects/storm-buddies 8080
```

## Stack

Vanilla HTML / CSS / JS. No build step. PWA via `sw.js` + `manifest.webmanifest`.

## Prestige helpers

Storm Relics unlock new buddies on the Relic Map. Each helper opens its own branch on the Upgrade Map:

| Relic | Helper | Branch |
|-------|--------|--------|
| (start) | Storm Kitten | kitten |
| Wind Owl | Wind Owl | owl |
| Thunder Fox | Thunder Fox | fox |
| Storm Bunny | Storm Bunny | bunny |
| Sky Pack | all at once | — |

## Controls

- Mobile: invisible floating joystick
- Desktop: WASD / arrows
- Paw button: send the active buddy to a tapped tile
