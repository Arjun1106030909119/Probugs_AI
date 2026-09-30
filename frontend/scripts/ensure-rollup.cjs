const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');

// Render and Vercel build on Linux. Some cached npm installs omit Rollup's
// optional native package, which makes `vite build` fail before compilation.
// Keep Windows development unchanged and repair only the affected platform.
if (process.platform === 'linux' && process.arch === 'x64') {
    const requireFromProject = createRequire(`${process.cwd()}/package.json`);

    try {
        requireFromProject.resolve('@rollup/rollup-linux-x64-gnu');
    } catch {
        const npm = process.env.npm_execpath || (process.platform === 'win32' ? 'npm.cmd' : 'npm');
        const result = spawnSync(npm, [
            'install',
            '--no-save',
            '--package-lock=false',
            '--include=optional',
            '@rollup/rollup-linux-x64-gnu@4.56.0'
        ], { stdio: 'inherit', shell: false });

        if (result.status !== 0) {
            process.exit(result.status || 1);
        }
    }
}
