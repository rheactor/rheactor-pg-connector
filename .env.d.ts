/* eslint-disable unicorn/name-replacements */
/* eslint-disable importPlugin/unambiguous */
namespace NodeJS {
  interface ProcessEnv {
    POSTGRES_HOST: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DATABASE: string;
  }
}
