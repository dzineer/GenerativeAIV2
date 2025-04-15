import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { glob } from 'glob';
import fs from 'fs';

import monacoEditorPlugin from 'vite-plugin-monaco-editor';
// Import the electron plugin
import electron from 'vite-plugin-electron';
import { copyElectronFilesPlugin, copyPluginsPlugin } from './electron-config-utils/config-utils';
import { getPluginEntries } from './plugins-utils/utils';

// ============= Path Constants =============
const PLUGINS_DIR = path.resolve(__dirname, 'src/plugins');
const SRC_DIR = path.resolve(__dirname, 'src');
const DIST_DIR = path.resolve(__dirname, 'dist');
const RESOURCES_DIR = path.resolve(__dirname, 'resources');
const OUTPUT_DIR = 'dist';

/**
 * Configuration for all preload files
 * @type {Array<{name: string, file: string, inputName: string, path: string}>}
 */
const preloaderFilesConfig = [
  {
    name: 'main-preload',
    file: 'main-preload.js',
    inputName: 'preload',
    path: path.resolve(__dirname, 'src/preload/main-preload.js'),
  },
  {
    name: 'status-bar-preload',
    file: 'status-bar-preload.js',
    inputName: 'statusBarPreload',
    path: path.resolve(__dirname, 'src/preload/status-bar-preload.js'),
  },
  {
    name: 'plugin-preload',
    file: 'plugin-preload.js',
    inputName: 'pluginPreload',
    path: path.resolve(__dirname, 'src/preload/plugin-preload.js'),
  },
  {
    name: 'plugin-loader',
    file: 'plugin-loader.js',
    inputName: 'pluginLoader',
    path: path.resolve(__dirname, 'src/main/services/plugin-loader.js'),
  }
]

const preloader = { 
  files: [],
  paths: [],
  input: {}
};

const pluginLoader = {
  path: preloaderFilesConfig.find(f => f.name === 'plugin-loader').path
};

/** @type {string[]} Files to be copied during build */
preloader.files = preloaderFilesConfig.map(f => f.file)

/** @type {string[]} Full paths for entry points */
preloader.paths = preloaderFilesConfig.map(file => file.path);

/** @type {Object.<string, string>} Input configuration for rollup */
preloader.input = Object.assign({}, 
  ...preloaderFilesConfig.map(file => ({ [file.inputName]: file.path }))
);

const electronFiles = {
  main: {
    files: [
      'index.js',
      'main.js',
      'window-manager.js',
      'utils/**/*.js',
      'ipc-handlers/**/*.js',
      'services/**/*.js'
    ],
    from: 'src/main',
    to: 'dist/main',
  },
  preload: {
    files: ['**/*.js'], // Copy all JS files from preload directory
    from: 'src/preload',
    to: 'dist/preload',
  },
  expectedDirectories: [
    'dist/main', 
    'dist/preload', 
    'dist/renderer',
    'dist/main/utils',
    'dist/main/ipc-handlers',
    'dist/main/services',
    'dist/plugins'
  ]
}

const aliases = {
  '@': path.resolve(__dirname, './src'),
  '@main': path.resolve(__dirname, './src/main'),
  '@services': path.resolve(__dirname, './src/main/services'),
  '@handlers': path.resolve(__dirname, './src/main/ipc-handlers'),
  '@preloaders': path.resolve(__dirname, './src/preload'),
}

// Helper function for the plugin options
const monacoPluginInstance = monacoEditorPlugin.default || monacoEditorPlugin;



const getRequiredPlugins = () => {
  return [
    react(),
    monacoPluginInstance({
      languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'],
    }),
  ]
};

const getMainProcessRollupOptions = () => {
  return {
    input: {
      main: path.resolve(__dirname, 'src/main/index.js'),
      ...Object.fromEntries(
        glob.sync('src/main/**/*.js').map(file => [
          file.replace('src/main/', '').replace('.js', ''),
          path.resolve(__dirname, file)
        ])
      )
    },
    output: {
      format: 'cjs',
      dir: 'dist/main',
      preserveModules: true,
      preserveModulesRoot: 'src/main',
      entryFileNames: '[name].js'
    },
    external: [
      'electron',
      'electron-store',
      'fix-path',
      'path',
      'fs',
      'fs/promises',
      'os',
      'react',
      'react-dom'
    ],
    preserveEntrySignatures: 'strict'
  }
}

const getPreloadProcessRollupOptions = () => {
  return {
    input: glob.sync('src/preload/**/*.js').reduce((acc, file) => {
      const name = file.replace('src/preload/', '').replace('.js', '');
      acc[name] = path.resolve(__dirname, file);
      return acc;
    }, {}),
    output: {
      format: 'cjs',
      dir: 'dist/preload',
      preserveModules: true,
      preserveModulesRoot: 'src/preload'
    },
    external: [
      'electron',
      'path',
      'fs',
      'fs/promises',
      'os'
    ],
    preserveEntrySignatures: 'strict'
  }
}

const getRendererProcessRollupOptions = () => {
  return {
    input: {
      main: 'index.html',
      statusBar: 'status-bar.html',
      ...getPluginEntries(PLUGINS_DIR),
    },
    output: {
      format: 'es',
      dir: 'dist/renderer',
      entryFileNames: (chunkInfo) => {
        if (chunkInfo.facadeModuleId?.includes('/plugins/')) {
          const relativePath = chunkInfo.facadeModuleId
            .split('/plugins/')[1]
            .replace(/\.jsx$/, '.js');
          return `plugins/${relativePath}`;
        }
        return 'assets/[name]-[hash].js';
      },
      assetFileNames: (assetInfo) => {
        if (!assetInfo?.name && !assetInfo?.fileName) {
          throw new Error('Asset name and fileName are undefined');
        }

        const name = assetInfo?.name || assetInfo?.fileName;

        if (name.startsWith('plugins/')) {
          return name;
        }

        return 'assets/[name]-[hash][extname]';
      },
    },
  }
}



export default defineConfig({
  plugins: [
    ...getRequiredPlugins(),
    electron([
      {
        // Electron main process entry
        entry: 'src/main/index.js',
        vite: {
          build: {
            outDir: 'dist/main',
            sourcemap: true,
            minify: false,
            rollupOptions: getMainProcessRollupOptions()
          },
          resolve: {
            alias: aliases,
            mainFields: ['module', 'main']
          }
        }
      },
      {
        entry: glob.sync('src/preload/**/*.js'),
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            sourcemap: true,
            minify: false,
            rollupOptions: getPreloadProcessRollupOptions()
          },
          resolve: {
            alias: aliases
          }
        }
      }
    ]),
    copyPluginsPlugin(PLUGINS_DIR, OUTPUT_DIR, RESOURCES_DIR),
    copyElectronFilesPlugin(electronFiles),
  ],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: getRendererProcessRollupOptions(),
  },
  resolve: {
    alias: aliases,
  },
  optimizeDeps: {
    include: [],
    exclude: ['electron'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  define: {
    'process.env': {},
    '__dirname': JSON.stringify(__dirname)
  }
}); 