/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PACKAGE_VERSION: string
  readonly GIT_COMMIT_HASH: string
  readonly GIT_COMMIT_DATE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
