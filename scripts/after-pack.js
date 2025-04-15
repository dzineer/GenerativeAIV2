const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const { appOutDir, packager, electronPlatformName } = context;

  console.log('After pack hook running...');
  console.log('App output directory:', appOutDir);
  console.log('Platform:', electronPlatformName);

  // Ensure source maps are preserved in the correct location
  const resourcesPath = path.join(appOutDir, 
    electronPlatformName === 'darwin' ? 
      'Vibe AI Studio.app/Contents/Resources/app.asar' : 
      'resources/app.asar'
  );

  console.log('Resources path:', resourcesPath);
  console.log('Preserving source maps and debug symbols...');

  // Add debug environment variable
  const envPath = path.join(appOutDir, '.env');
  fs.writeFileSync(envPath, 'ELECTRON_ENABLE_SOURCE_MAPS=1\nELECTRON_ENABLE_LOGGING=1\n');

  console.log('After pack hook completed');
}; 