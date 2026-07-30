import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HrefNavItem, ResourceNSNavItem, Separator } from '@console/dynamic-plugin-sdk';
import {
  isHrefNavItem,
  isResourceNavItem,
  isSeparator,
  isResourceNSNavItem,
} from '@console/dynamic-plugin-sdk';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useK8sModels } from '@console/shared/src/hooks/useK8sModels';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { NavSection } from '../NavSection';
import { useNavExtensionsForSection } from '../useNavExtensionsForSection';

jest.mock('@console/shared/src/hooks/useK8sModels', () => ({
  useK8sModels: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useLocation', () => ({
  useLocation: jest.fn(),
}));

jest.mock('../useNavExtensionsForSection', () => ({
  useNavExtensionsForSection: jest.fn(),
}));

jest.mock('../NavItemHref', () => ({
  NavItemHref: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
}));

jest.mock('../NavItemResource', () => ({
  NavItemResource: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  isHrefNavItem: jest.fn(),
  isResourceNavItem: jest.fn(),
  isSeparator: jest.fn(),
  isResourceNSNavItem: jest.fn(),
}));

const createHrefExtension = (id: string, name: string): LoadedExtension<HrefNavItem> =>
  ({
    type: 'console.navigation/href',
    uid: `uid-${id}`,
    properties: {
      id,
      name,
      href: `/${id}`,
      section: 'workloads',
    },
  } as LoadedExtension<HrefNavItem>);

const createResourceExtension = (id: string, name: string): LoadedExtension<ResourceNSNavItem> =>
  ({
    type: 'console.navigation/resource-ns',
    uid: `uid-${id}`,
    properties: {
      id,
      name,
      model: { group: '', version: 'v1', kind: 'Pod' },
      section: 'workloads',
    },
  } as LoadedExtension<ResourceNSNavItem>);

const createSeparatorExtension = (id: string): LoadedExtension<Separator> =>
  ({
    type: 'console.navigation/separator',
    uid: `uid-${id}`,
    properties: {
      id,
      section: 'workloads',
    },
  } as LoadedExtension<Separator>);

describe('NavSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useK8sModels as jest.Mock).mockReturnValue([{}]);
    (useLocation as jest.Mock).mockReturnValue('/other/path');
    (useNavExtensionsForSection as jest.Mock).mockReturnValue([]);
    ((isHrefNavItem as unknown) as jest.Mock).mockReturnValue(false);
    ((isResourceNavItem as unknown) as jest.Mock).mockReturnValue(false);
    ((isSeparator as unknown) as jest.Mock).mockReturnValue(false);
    ((isResourceNSNavItem as unknown) as jest.Mock).mockReturnValue(false);
  });

  it('should return null when section has no children', () => {
    (useNavExtensionsForSection as jest.Mock).mockReturnValue([]);

    renderWithProviders(<NavSection id="empty-section" name="Empty Section" />);

    expect(screen.queryByRole('button', { name: /Empty Section/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Navigation' })).not.toBeInTheDocument();
  });

  it('should render expandable section with name', () => {
    const hrefExtension = createHrefExtension('dashboard', 'Dashboard');
    (useNavExtensionsForSection as jest.Mock).mockReturnValue([hrefExtension]);
    ((isHrefNavItem as unknown) as jest.Mock).mockReturnValue(true);

    renderWithProviders(<NavSection id="workloads" name="Workloads" />);

    expect(screen.getByRole('button', { name: /Workloads/i })).toBeVisible();
  });

  it('should render NavGroup without title when name is empty', () => {
    const hrefExtension = createHrefExtension('home', 'Home');
    (useNavExtensionsForSection as jest.Mock).mockReturnValue([hrefExtension]);
    ((isHrefNavItem as unknown) as jest.Mock).mockReturnValue(true);

    renderWithProviders(<NavSection id="home" name="" />);

    // Should render children but not as expandable
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeVisible();
  });

  it('should render href nav items', async () => {
    const user = userEvent.setup();
    const hrefExtension = createHrefExtension('dashboard', 'Dashboard');
    (useNavExtensionsForSection as jest.Mock).mockReturnValue([hrefExtension]);
    ((isHrefNavItem as unknown) as jest.Mock).mockImplementation((ext) => ext === hrefExtension);

    renderWithProviders(<NavSection id="workloads" name="Workloads" />);

    await user.click(screen.getByRole('button', { name: /Workloads/i }));

    expect(await screen.findByText('Dashboard')).toBeVisible();
  });

  it('should render resource nav items', async () => {
    const user = userEvent.setup();
    const resourceExtension = createResourceExtension('pods', 'Pods');
    (useNavExtensionsForSection as jest.Mock).mockReturnValue([resourceExtension]);
    ((isResourceNavItem as unknown) as jest.Mock).mockImplementation(
      (ext) => ext === resourceExtension,
    );

    renderWithProviders(<NavSection id="workloads" name="Workloads" />);

    await user.click(screen.getByRole('button', { name: /Workloads/i }));

    expect(await screen.findByText('Pods')).toBeVisible();
  });

  it('should render separators between items', () => {
    const separatorExtension = createSeparatorExtension('separator-1');
    (useNavExtensionsForSection as jest.Mock).mockReturnValue([separatorExtension]);
    ((isSeparator as unknown) as jest.Mock).mockImplementation((ext) => ext === separatorExtension);

    renderWithProviders(<NavSection id="workloads" name="Workloads" />);

    expect(screen.getByRole('presentation', { hidden: true })).toBeInTheDocument();
  });

  it('should expand section when toggle is clicked', async () => {
    const user = userEvent.setup();
    const hrefExtension = createHrefExtension('dashboard', 'Dashboard');
    (useNavExtensionsForSection as jest.Mock).mockReturnValue([hrefExtension]);
    ((isHrefNavItem as unknown) as jest.Mock).mockReturnValue(true);

    renderWithProviders(<NavSection id="workloads" name="Workloads" />);

    const toggle = screen.getByRole('button', { name: /Workloads/i });
    await user.click(toggle);

    expect(await screen.findByRole('button', { name: /Workloads/i, expanded: true })).toBe(toggle);
  });
});
