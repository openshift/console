import { test } from '../../fixtures';

test.describe(
  'Customization of catalogs via YAML',
  { tag: ['@regression', '@dev-console'] },
  () => {
    test('when all the sub-catalogs are disabled', async () => {
      test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
    });

    test('when all the sub-catalogs are enabled', async () => {
      test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
    });

    test('when specific sub-catalog is disabled', async () => {
      test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
    });

    test('when specific sub-catalog is enabled', async () => {
      test.skip(true, 'Manual test — requires YAML editing of cluster console resource');
    });
  },
);
