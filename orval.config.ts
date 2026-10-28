import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: process.env.OPENAPI_INPUT ?? '../play-together-be/openapi.json',
    },
    output: {
      target: 'src/api/generated/endpoints',
      schemas: 'src/api/generated/models',
      mode: 'tags-split',
      httpClient: 'axios',
      override: {
        mutator: {
          path: 'src/api/orval-mutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
