const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('\n=== Starting Build Verification ===\n');

// Define critical build paths
const projectRoot = path.resolve(__dirname, '..');
const buildPaths = {
  dist: path.join(projectRoot, 'dist'),
  distElectron: path.join(projectRoot, 'dist-electron'),
  release: path.join(projectRoot, 'release'),
  plugins: path.join(projectRoot, 'plugins')
};

// Verify build directories
console.log('Verifying build directories...');
Object.entries(buildPaths).forEach(([name, dirPath]) => {
  const exists = fs.existsSync(dirPath);
  console.log(`\n${name.toUpperCase()} Directory:`);
  console.log(`Path: ${dirPath}`);
  console.log(`Status: ${exists ? 'EXISTS ✅' : 'MISSING ❌'}`);
  
  if (exists) {
    try {
      const contents = fs.readdirSync(dirPath);
      console.log('Contents:', contents);
      
      // For dist directory, verify critical files
      if (name === 'dist') {
        console.log('\nVerifying dist contents:');
        const criticalFiles = ['index.html', 'status-bar.html'];
        criticalFiles.forEach(file => {
          const filePath = path.join(dirPath, file);
          console.log(`${file}: ${fs.existsSync(filePath) ? 'EXISTS ✅' : 'MISSING ❌'}`);
        });
      }
      
      // For dist-electron directory, verify critical files
      if (name === 'distElectron') {
        console.log('\nVerifying dist contents:');
        const criticalFiles = ['main.js', 'preload.js', 'statusBarPreload.js', 'pluginPreload.js'];
        criticalFiles.forEach(file => {
          const filePath = path.join(dirPath, file);
          console.log(`${file}: ${fs.existsSync(filePath) ? 'EXISTS ✅' : 'MISSING ❌'}`);
        });
      }
    } catch (err) {
      console.error(`Error reading ${name} directory:`, err);
    }
  }
});

// Verify plugins
console.log('\n=== Verifying Plugins ===\n');
if (fs.existsSync(buildPaths.plugins)) {
  const pluginDirs = fs.readdirSync(buildPaths.plugins)
    .filter(item => fs.statSync(path.join(buildPaths.plugins, item)).isDirectory());
  
  console.log('Found plugin directories:', pluginDirs);
  
  pluginDirs.forEach(pluginDir => {
    const pluginPath = path.join(buildPaths.plugins, pluginDir);
    console.log(`\nChecking plugin: ${pluginDir}`);
    
    // Check package.json
    const manifestPath = path.join(pluginPath, 'package.json');
    console.log(`package.json: ${fs.existsSync(manifestPath) ? 'EXISTS ✅' : 'MISSING ❌'}`);
    
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        console.log('Plugin details:', {
          name: manifest.name,
          version: manifest.version,
          main: manifest.main,
          electronPlugin: manifest.electronPlugin
        });
        
        // Check entry points
        if (manifest.main) {
          const mainPath = path.join(pluginPath, manifest.main);
          console.log(`Main entry (${manifest.main}): ${fs.existsSync(mainPath) ? 'EXISTS ✅' : 'MISSING ❌'}`);
        }
        
        if (manifest.electronPlugin?.backendEntry) {
          const backendPath = path.join(pluginPath, manifest.electronPlugin.backendEntry);
          console.log(`Backend entry (${manifest.electronPlugin.backendEntry}): ${fs.existsSync(backendPath) ? 'EXISTS ✅' : 'MISSING ❌'}`);
        }
      } catch (err) {
        console.error(`Error reading plugin manifest for ${pluginDir}:`, err);
      }
    }
  });
}

// Verify release artifacts if they exist
console.log('\n=== Verifying Release Artifacts ===\n');
if (fs.existsSync(buildPaths.release)) {
  const releaseContents = fs.readdirSync(buildPaths.release);
  console.log('Release directory contents:', releaseContents);
  
  // Check for platform-specific artifacts
  const macArtifacts = releaseContents.filter(file => file.endsWith('.dmg') || file.endsWith('.app'));
  const winArtifacts = releaseContents.filter(file => file.endsWith('.exe') || file.endsWith('.msi'));
  const linuxArtifacts = releaseContents.filter(file => file.endsWith('.AppImage') || file.endsWith('.deb'));
  
  console.log('\nPlatform artifacts found:');
  console.log('macOS:', macArtifacts.length ? macArtifacts : 'None');
  console.log('Windows:', winArtifacts.length ? winArtifacts : 'None');
  console.log('Linux:', linuxArtifacts.length ? linuxArtifacts : 'None');
}

console.log('\n=== Build Verification Complete ===\n'); 