# Guess the art time!

A simple website that uses data sourced from getty to make a little quiz about the time a painting / art piece was made.

## Downloading the data

`curl https://www.getty.edu/art/collection/api/search?from=0&size=5000&open_content=true > data/5k.json`

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
