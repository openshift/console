import { render, screen, fireEvent, within } from '@testing-library/react';
import { Map as ImmutableMap } from 'immutable';

import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { getReferenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ResourceListDropdown_ } from '../resource-dropdown';

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

const buildModelsMap = (models: K8sKind[]): ImmutableMap<string, K8sKind> =>
  ImmutableMap<string, K8sKind>().withMutations((map) => {
    models.forEach((m) => {
      map.set(getReferenceForModel(m), m);
    });
  });

const defaultProps = {
  selected: [] as string[],
  onChange: jest.fn(),
  recentList: false,
};

const renderDropdown = (models: K8sKind[], groupToVersionMap = {}, props = {}) => {
  const allModels = buildModelsMap(models);
  return render(
    <ResourceListDropdown_
      {...defaultProps}
      allModels={allModels}
      groupToVersionMap={groupToVersionMap}
      {...props}
    />,
  );
};

const openDropdown = () => {
  fireEvent.click(screen.getByRole('combobox'));
};

const typeInSearch = (text: string) => {
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: text } });
};

const getMenuItems = () => screen.getAllByRole('menuitem');

describe('ResourceListDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPreference.mockReturnValue(['[]', jest.fn(), true]);
    defaultProps.onChange = jest.fn();
  });

  describe('preferred version filtering', () => {
    it('shows only the preferred version when groupToVersionMap is provided', () => {
      const models = [
        makeModel('Deployment', 'apps', 'v1'),
        makeModel('Deployment', 'apps', 'v1beta1'),
      ];
      const groupToVersionMap = {
        apps: { preferredVersion: 'v1' },
      };

      renderDropdown(models, groupToVersionMap);
      openDropdown();

      const items = getMenuItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Deployment');
    });

    it('shows all versions when no preferred version exists', () => {
      const models = [
        makeModel('Deployment', 'apps', 'v1'),
        makeModel('Deployment', 'apps', 'v1beta1'),
      ];

      renderDropdown(models, {});
      openDropdown();

      expect(getMenuItems()).toHaveLength(2);
    });
  });

  describe('search filtering', () => {
    it('filters resources by reference name (case-insensitive)', () => {
      const models = [
        makeModel('Pod', 'core', 'v1'),
        makeModel('Deployment', 'apps', 'v1'),
        makeModel('Service', 'core', 'v1'),
      ];

      renderDropdown(models);
      openDropdown();
      typeInSearch('pod');

      const items = getMenuItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Pod');
    });

    it('filters resources by short name', () => {
      const models = [
        makeModel('Pod', 'core', 'v1', { shortNames: ['po'] }),
        makeModel('Deployment', 'apps', 'v1', { shortNames: ['deploy'] }),
      ];

      renderDropdown(models);
      openDropdown();
      typeInSearch('deploy');

      const items = getMenuItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Deployment');
    });

    it('shows "No results found" when no resources match', () => {
      const models = [makeModel('Pod', 'core', 'v1')];

      renderDropdown(models);
      openDropdown();
      typeInSearch('nonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('shows all resources when search is cleared', () => {
      const models = [makeModel('Pod', 'core', 'v1'), makeModel('Deployment', 'apps', 'v1')];

      renderDropdown(models);
      openDropdown();
      typeInSearch('pod');
      expect(getMenuItems()).toHaveLength(1);

      typeInSearch('');
      expect(getMenuItems()).toHaveLength(2);
    });
  });

  describe('MAX_VISIBLE_ITEMS cap', () => {
    it('caps rendered items at 100 and shows truncation message', () => {
      const models = Array.from({ length: 150 }, (_, i) =>
        makeModel(`Resource${String(i).padStart(3, '0')}`, 'test.io', 'v1'),
      );

      renderDropdown(models);
      openDropdown();

      const menu = screen.getByRole('menu');
      const items = within(menu).getAllByRole('menuitem');
      // 100 resource items + 1 truncation message (rendered as menuitem)
      expect(items.length).toBeLessThanOrEqual(101);

      expect(screen.getByText('Showing 100 of 150 resources. Type to filter.')).toBeInTheDocument();
    });

    it('does not show truncation message when items fit within the cap', () => {
      const models = Array.from({ length: 50 }, (_, i) =>
        makeModel(`Resource${i}`, 'test.io', 'v1'),
      );

      renderDropdown(models);
      openDropdown();

      expect(screen.queryByText(/Showing .* of .* resources/)).not.toBeInTheDocument();
    });

    it('filtering below the cap removes the truncation message', () => {
      const models = Array.from({ length: 150 }, (_, i) =>
        makeModel(`Resource${String(i).padStart(3, '0')}`, 'test.io', 'v1'),
      );

      renderDropdown(models);
      openDropdown();
      expect(screen.getByText(/Showing 100 of 150/)).toBeInTheDocument();

      typeInSearch('Resource00');
      expect(screen.queryByText(/Showing .* of .* resources/)).not.toBeInTheDocument();
    });
  });

  describe('auto-open on typing', () => {
    it('opens the dropdown when the user starts typing', () => {
      const models = [makeModel('Pod', 'core', 'v1')];

      renderDropdown(models);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      typeInSearch('pod');

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });
});
