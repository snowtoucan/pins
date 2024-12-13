export default {
    root: 'src/',
    publicDir: '../static/',
    plugins: [], // Remove the Vue plugin
    server: {
      host: true,
      open: true // Always open the dev server, since Vue plugin is removed
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      sourcemap: true
    }
  };