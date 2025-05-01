export async function loadStore() {
  try {
    // Import as a module rather than using require
    const electronStore = await import('electron-store');
    return electronStore;
  } catch (error) {
    console.error('Failed to load electron-store:', error);
    throw error;
  }
}