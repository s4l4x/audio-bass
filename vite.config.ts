import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'
import { execSync } from 'child_process'

// Get the latest commit hash
const getGitCommitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

// Get the latest commit date
const getGitCommitDate = () => {
  try {
    return execSync('git log -1 --format=%cd --date=short').toString().trim()
  } catch {
    return 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.GIT_COMMIT_HASH': JSON.stringify(getGitCommitHash()),
    'import.meta.env.GIT_COMMIT_DATE': JSON.stringify(getGitCommitDate())
  }
})
