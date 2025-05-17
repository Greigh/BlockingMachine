export async function loadStore() {
  try {
    const Store = require('electron-store');
    return new Store();
  } catch (error) {
    console.error('Failed to load electron-store:', error);
    throw error;
  }
}