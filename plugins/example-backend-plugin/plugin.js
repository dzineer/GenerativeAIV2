console.log('[ExamplePlugin] Script loaded in sandboxed renderer.');

// Check if the pluginAPI is exposed (it should be via pluginPreload.js)
if (window.pluginAPI) {
  console.log('[ExamplePlugin] pluginAPI found, sending log message...');
  
  // Use the exposed API to send logs to the main process
  window.pluginAPI.log('info', 'Example backend plugin initialized successfully!');
  window.pluginAPI.log('warn', 'This is a warning from the example plugin.');
  
  // Example of trying to do something disallowed in sandbox (likely won't work)
  try {
    const fs = require('fs'); // Should fail due to contextIsolation/sandbox
    console.error('[ExamplePlugin] ERROR: Unexpectedly gained access to fs!');
  } catch (err) {
    window.pluginAPI.log('info', 'Correctly failed to access Node\'s fs module directly.');
  }
  
} else {
  console.error('[ExamplePlugin] ERROR: pluginAPI not found on window! Preload script likely failed.');
}

// Keep the plugin alive (optional, depends on plugin type)
// setInterval(() => {
//   window.pluginAPI?.log('debug', 'Example plugin heartbeat');
// }, 30000); 