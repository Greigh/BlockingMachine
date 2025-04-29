export async function loadStore() {
  try {
    const { default: Store } = await import('electron-store');
    return Store;
  } catch (error) {
    console.error('Failed to load electron-store:', error);
    throw error;
  }
}