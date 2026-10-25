import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { getReferenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { InnerResourceListDropdown } from '../resource-dropdown';

jest.mock('../utils/resource-icon', () => ({
  ResourceIcon: jest.fn(() => null),
}));

jest.mock('../../module/k8s', () => ({
  referenceForModel: jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref')
    .getReferenceForModel,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const text = key.replace('public~', '');
      if (opts) {
        return Object.entries(opts).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
          text,
        );
      }
      return text;
    },
  }),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const mockUseUserPreference = useUserPreference as jest.Mock;

type K8sKind = K8sModel;

const makeModel = (
  kind: string,
  apiGroup: string,
  apiVersion: string,
  overrides: Partial<K8sKind> = {},
): K8sKind => ({
  kind,
  apiGroup,
  apiVersion,
  abbr: kind.substring(0, 2).toUpperCase(),
  label: kind,
  labelPlural: `${kind}s`,
  plural: `${kind.toLowerCase()}s`,
  ...overrides,
});

const buildModelsMap = (models: K8sKind[]): Record<string, K8sKind> => {
  const map: Record<string, K8sKind> = {};
  models.forEach((m) => {
    map[getReferenceForModel(m)] = m;
  });
  return map;
};

const defaultProps = {
  selected: [] as string[],
  onChange: jest.fn(),
  recentList: false,
};

const renderDropdown = (models: K8sKind[], groupToVersionMap = {}, props = {}) => {
  const allModels = buildModelsMap(models);
  return render(
    <InnerResourceListDropdown
      {...defaultProps}
      allModels={allModels}
      groupToVersionMap={groupToVersionMap}
      {...props}
    />,
  );
};

const openDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('combobox'));
};

const typeInSearch = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  const input = screen.getByRole('combobox');
  await user.clear(input);
  if (text) {
    await user.type(input, text);
  }
};

const getMenuItems = () => screen.getAllByRole('menuitem');

describe('ResourceListDropdown', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPreference.mockReturnValue(['[]', jest.fn(), true]);
    defaultProps.onChange = jest.fn();
    user = userEvent.setup();
  });

  describe('preferred version filtering', () => {
    it('shows only the preferred version when groupToVersionMap is provided', async () => {
      const models = [
        makeModel('Deployment', 'apps', 'v1'),
        makeModel('Deployment', 'apps', 'v1beta1'),
      ];
      const groupToVersionMap = {
        apps: { preferredVersion: 'v1' },
      };

      renderDropdown(models, groupToVersionMap);
      await openDropdown(user);

      const items = getMenuItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Deployment');
    });

    it('shows all versions when no preferred version exists', async () => {
      const models = [
        makeModel('Deployment', 'apps', 'v1'),
        makeModel('Deployment', 'apps', 'v1beta1'),
      ];

      renderDropdown(models, {});
      await openDropdown(user);

      expect(getMenuItems()).toHaveLength(2);
    });
  });

  describe('search filtering', () => {
    it('filters resources by reference name (case-insensitive)', async () => {
      const models = [
        makeModel('Pod', 'core', 'v1'),
        makeModel('Deployment', 'apps', 'v1'),
        makeModel('Service', 'core', 'v1'),
      ];

      renderDropdown(models);
      await openDropdown(user);
      await typeInSearch(user, 'pod');

      const items = getMenuItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Pod');
    });

    it('filters resources by short name', async () => {
      const models = [
        makeModel('Pod', 'core', 'v1', { shortNames: ['po'] }),
        makeModel('Deployment', 'apps', 'v1', { shortNames: ['deploy'] }),
      ];

      renderDropdown(models);
      await openDropdown(user);
      await typeInSearch(user, 'deploy');

      const items = getMenuItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Deployment');
    });

    it('shows "No results found" when no resources match', async () => {
      const models = [makeModel('Pod', 'core', 'v1')];

      renderDropdown(models);
      await openDropdown(user);
      await typeInSearch(user, 'nonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('shows all resources when search is cleared', async () => {
      const models = [makeModel('Pod', 'core', 'v1'), makeModel('Deployment', 'apps', 'v1')];

      renderDropdown(models);
      await openDropdown(user);
      await typeInSearch(user, 'pod');
      expect(getMenuItems()).toHaveLength(1);

      await typeInSearch(user, '');
      expect(getMenuItems()).toHaveLength(2);
    });
  });

  describe('MAX_VISIBLE_ITEMS cap', () => {
    it('caps rendered items at 250 and shows truncation message', async () => {
      const models = Array.from({ length: 300 }, (_, i) =>
        makeModel(`Resource${String(i).padStart(3, '0')}`, 'test.io', 'v1'),
      );

      renderDropdown(models);
      await openDropdown(user);

      const menu = screen.getByRole('menu');
      const items = within(menu).getAllByRole('menuitem');
      // 250 resource items + 1 truncation message (rendered as menuitem)
      expect(items.length).toBeLessThanOrEqual(251);

      expect(screen.getByText('Showing 250 of 300 resources. Type to filter.')).toBeInTheDocument();
    });

    it('does not show truncation message when items fit within the cap', async () => {
      const models = Array.from({ length: 50 }, (_, i) =>
        makeModel(`Resource${i}`, 'test.io', 'v1'),
      );

      renderDropdown(models);
      await openDropdown(user);

      expect(screen.queryByText(/Showing .* of .* resources/)).not.toBeInTheDocument();
    });

    it('filtering below the cap removes the truncation message', async () => {
      const models = Array.from({ length: 300 }, (_, i) =>
        makeModel(`Resource${String(i).padStart(3, '0')}`, 'test.io', 'v1'),
      );

      renderDropdown(models);
      await openDropdown(user);
      expect(screen.getByText(/Showing 250 of 300/)).toBeInTheDocument();

      await typeInSearch(user, 'Resource00');
      expect(screen.queryByText(/Showing .* of .* resources/)).not.toBeInTheDocument();
    });
  });

  describe('auto-open on typing', () => {
    it('opens the dropdown when the user starts typing', async () => {
      const models = [makeModel('Pod', 'core', 'v1')];

      renderDropdown(models);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      await typeInSearch(user, 'pod');

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });
});
