import { initFederation } from '@angular-architects/native-federation';
import {
  localStorageEntry,
  consoleLogger,
} from '@softarc/native-federation-orchestrator/options';

/**
 * Angular adapter → @softarc/native-federation-orchestrator (v4).
 * Options pass through the adapter into initFederation (storage, profile, feature, logLevel).
 * @see https://github.com/native-federation/orchestrator
 */
initFederation('federation.manifest.json', {
  hostRemoteEntry: { url: './remoteEntry.json' },
  // Persist remoteEntry + shared metadata across reloads (SSR/MPA-friendly).
  storage: localStorageEntry,
  logger: consoleLogger,
  logLevel: 'warn',
  profile: {
    // Rebuilds on the same localhost URL should refresh cached remoteEntry.json.
    overrideCachedRemotes: 'init-only',
    overrideCachedRemotesIfURLMatches: true,
  },
  feature: {
    // Accept older flat SharedInfo remotes; dense Core 4.3+ remotes pass through.
    convertFlatSharedInfo: true,
  },
})
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
