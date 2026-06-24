/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'synthetic' | 'json';
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
