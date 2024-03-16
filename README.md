# Guess the art time!

A simple website that uses data sourced from getty to make a little quiz about the time a painting / art piece was made.

## Features

- more than 40k questions!
- End results
- Early quitting

## Downloading the data

`curl "https://www.getty.edu/art/collection/api/search?from=5000&size=50000&open_content=true" > data/50k.json`

> ![TIP]
> Only do this if you need to modify `transform.ts` so that getty wont limit this

## Development

```sh
bun i
bun run dev
```

Then edit `src/components/main.svelte`

## Todo

- fix layout shifts with images loading
- maybe proxy images or something i have a feeling that getty wont like this
- create some global statistics or something so that you can compare your skill to others
- maybe make it multiplayer
- A main screen giving some info about the game and possibly other gamemodes
- Branding?, we could use a nice icon and a image for the readme / twitter embed
