import { build, serve } from 'esbuild'
import { htmlPlugin } from '@craftamap/esbuild-plugin-html'
import { default as makePlugin } from 'node-stdlib-browser/helpers/esbuild/plugin'
import stdLibBrowser from 'node-stdlib-browser'
import esbuildSvelte from 'esbuild-svelte'
import fs from 'fs'
import path from 'path'

/**
 * The esbuild-plugin-html plugin takes the template as a string so this
 * function reads a template from file and returns the result
 */
function template (filename) {
  const templateFile = path.join('public', filename)
  return fs.readFileSync(templateFile)
}

build({
  entryPoints: ['src/main.js'],
  outdir: './build',
  target: 'es2020',
  bundle: true,
  metafile: true,
  sourcemap: true,

  // svelte is important here so that svelte component packages are handled correctly
  mainFields: ['svelte', 'browser', 'module', 'main'],

  /**
   * The documented way to do this uses `require.resolve` or `import.meta.resolve` but
   * I found that `import.meta.resolve` was giving a weird path so I just hardcoded
   * the path instead
   */
  inject: ['./node_modules/node-stdlib-browser/helpers/esbuild/shim.js'],
  define: {
    // env var handling
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),

    // node polyfill (using `node-stdlib-browser`)
    global: 'global',
    process: 'process',
    Buffer: 'Buffer',
    crypto: 'crypto'
  },

  plugins: [
    esbuildSvelte(),
    makePlugin(stdLibBrowser),
    htmlPlugin({
      files: [
        {
          entryPoints: ['src/main.js'],
          filename: 'index.html',
          htmlTemplate: template('index.html')
        }
      ]
    }),
  ],
})
/**
 * Horribly inefficient file copier but I was not having success
 * with existing plugins. Will need to revisit in the future
 */
.then(() => {
  const copyFiles = [
    // Themes
    'global.css',
  ]

  for (const f of copyFiles) {
    fs.copyFileSync(
      path.resolve(process.cwd(), 'public', f),
      path.resolve(process.cwd(), 'build', f)
    )
  }
})
.catch(err => {
  // TODO errors are already printed, maybe something better can be done
  // console.error(err)
  process.exit(1)
})
