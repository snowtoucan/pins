import vue from '@vitejs/plugin-vue';

const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env;

export default {
    root: 'src/',
    publicDir: '../static/',
    base: '/pins.github.io/',
    plugins: [vue()], // Using the Vue plugin now
    server: {
        host: true,
        open: !isCodeSandbox // Open if it's not a CodeSandbox
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true
    }
};