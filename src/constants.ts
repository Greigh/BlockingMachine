import { join } from 'path';

export const getEntryPoints = (buildDir: string) => ({
  MAIN_WINDOW_PRELOAD_ENTRY: join(buildDir, 'preload.js'),
  MAIN_WINDOW_ENTRY: join(buildDir, 'renderer.js')
});