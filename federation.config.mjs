import { withNativeFederation, fromPackageJson } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'app',

  shared: fromPackageJson({
    singleton: true,
    strictVersion: true,
    requiredVersion: 'auto',
    build: 'package',
  })
    // Explicit Angular packages — not `@angular/*`, which also matches @angular/cdk
    // and publishes Node-only secondaries that fail the browser shared bundle.
    .patch(
      [
        '@angular/core',
        '@angular/common',
        '@angular/forms',
        '@angular/platform-browser',
        '@angular/router',
      ],
      { includeSecondaries: { keepAll: true } },
    ),

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Optional peer of @angular/platform-browser; not installed in this host.
    '@angular/platform-browser/animations',
    '@angular/platform-browser/animations/async',
  ],

  features: {
    // ignoreUnusedDeps is enabled by default in v4
    denseChunking: true, // groups chunks in remoteEntry.json for smaller metadata
    denseExternals: true, // one entry per package — same entry points across builds
  },
});
