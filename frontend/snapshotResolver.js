// https://jestjs.io/docs/en/configuration.html#snapshotresolver-string

module.exports = {
  // example test path, used for preflight consistency check
  testPathForConsistencyCheck: 'some/__tests__/example.spec.ts',

  // map test path to snapshot path
  resolveSnapshotPath: (testPath, snapshotExtension) =>
    testPath.replace(/\.spec\.([tj]sx?)/, `${snapshotExtension}.$1`),

  // map snapshot path to test path
  resolveTestPath: (snapshotFilePath, snapshotExtension) =>
    snapshotFilePath.replace(snapshotExtension, '.spec'),
};
