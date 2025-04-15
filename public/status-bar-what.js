console.log('[Status Bar JS] Script executing.');

const toggleButton = document.getElementById('theme-toggle-btn');
const statusText = document.getElementById('status-text');

console.log('[Status Bar JS] toggleButton element:', toggleButton);
console.log('[Status Bar JS] window.theme object:', window.theme);

// Update UI based on theme info
function applyTheme(themeInfo) {
    if (!themeInfo) return; // Guard against initial undefined state
    const { isDarkMode, preference } = themeInfo;
    console.log('[Status Bar JS] Applying theme info:', themeInfo);

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    // Optionally display preference: e.g., toggleButton.textContent = `Theme: ${preference}`;
}

// *** Fetch initial state when script loads ***
console.log('[Status Bar JS] Attempting to get initial theme state...');
window.theme?.getInitialState().then(initialState => {
    console.log('[Status Bar JS] Received initial theme state:', initialState);
    applyTheme(initialState); // Apply the initial theme
}).catch(err => console.error('[Status Bar JS] Error getting initial theme state:', err));

// Listen for subsequent updates
console.log('[Status Bar JS] Attempting to register theme.onUpdate listener.');
try {
     window.theme?.onUpdate(applyTheme);
     console.log('[Status Bar JS] theme.onUpdate listener registered successfully (or window.theme is undefined).');
} catch (e) {
     console.error('[Status Bar JS] Error registering theme.onUpdate:', e);
}

// Handle toggle button click
if (toggleButton) {
    toggleButton.addEventListener('click', () => {
        console.log('[Status Bar JS] Toggle button clicked. Attempting to call window.theme.toggle().');
        window.theme?.toggle().then(newPreference => {
            console.log('[Status Bar JS] window.theme.toggle() successful. New preference:', newPreference);
        }).catch(err => {
            console.error('[Status Bar JS] Error calling window.theme.toggle():', err);
        });
    });
    console.log('[Status Bar JS] Click listener attached to toggleButton.');
} else {
    console.error('[Status Bar JS] Could not find toggleButton to attach listener!');
} 