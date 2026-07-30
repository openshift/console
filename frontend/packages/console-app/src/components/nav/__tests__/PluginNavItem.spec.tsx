import { screen } from '@testing-library/react';
import type {
  NavSection as NavSectionType,
  HrefNavItem,
  ResourceNSNavItem,
  Separator,
} from '@console/dynamic-plugin-sdk';
import {
  isNavSection,
  isSeparator,
  isHrefNavItem,
  isResourceNSNavItem,
  isResourceNavItem,
} from '@console/dynamic-plugin-sdk';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { FavoriteNavItems } from '../../favorite/FavoriteNavItems';
import { NavItemHref } from '../NavItemHref';
import { NavItemResource } from '../NavItemResource';
import { NavSection } from '../NavSection';
import { PluginNavItem } from '../PluginNavItem';
import { renderWithPerspective } from './navTestUtils';

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  isNavSection: jest.fn(),
  isSeparator: jest.fn(),
  isHrefNavItem: jest.fn(),
  isResourceNSNavItem: jest.fn(),
  isResourceNavItem: jest.fn(),
}));

jest.mock('../NavSection', () => ({
  NavSection: jest.fn(({ name }: { name: string }) => name),
}));

jest.mock('../NavItemHref', () => ({
  NavItemHref: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

jest.mock('../NavItemResource', () => ({
  NavItemResource: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

jest.mock('../../favorite/FavoriteNavItems', () => ({
  FavoriteNavItems: jest.fn(() => null),
}));

const MockNavSection = NavSection as jest.Mock;
const MockNavItemHref = NavItemHref as jest.Mock;
const MockNavItemResource = NavItemResource as jest.Mock;
const MockFavoriteNavItems = FavoriteNavItems as jest.Mock;

const createNavSectionExtension = (id: string, name: string): LoadedExtension<NavSectionType> =>
  ({
    type: 'console.navigation/section',
    uid: `uid-${id}`,
    properties: {
      id,
      name,
    },
  } as LoadedExtension<NavSectionType>);

const createHrefExtension = (id: string, name: string): LoadedExtension<HrefNavItem> =>
  ({
    type: 'console.navigation/href',
    uid: `uid-${id}`,
    properties: {
      id,
      name,
      href: `/${id}`,
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
    },
  } as LoadedExtension<ResourceNSNavItem>);

const createSeparatorExtension = (id: string): LoadedExtension<Separator> =>
  ({
    type: 'console.navigation/separator',
    uid: `uid-${id}`,
    properties: {
      id,
    },
  } as LoadedExtension<Separator>);

describe('PluginNavItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ((isNavSection as unknown) as jest.Mock).mockReturnValue(false);
    ((isSeparator as unknown) as jest.Mock).mockReturnValue(false);
    ((isHrefNavItem as unknown) as jest.Mock).mockReturnValue(false);
    ((isResourceNavItem as unknown) as jest.Mock).mockReturnValue(false);
    ((isResourceNSNavItem as unknown) as jest.Mock).mockReturnValue(false);
  });

  it('should render NavSection for section extension', () => {
    const sectionExtension = createNavSectionExtension('workloads', 'Workloads');
    ((isNavSection as unknown) as jest.Mock).mockReturnValue(true);

    renderWithPerspective(<PluginNavItem extension={sectionExtension} />);

    expect(screen.getByText('Workloads')).toBeVisible();
  });

  it('should render FavoriteNavItems for home section in admin perspective', () => {
    const homeSection = createNavSectionExtension('home', 'Home');
    ((isNavSection as unknown) as jest.Mock).mockReturnValue(true);

    renderWithPerspective(<PluginNavItem extension={homeSection} />, 'admin');

    expect(MockFavoriteNavItems).toHaveBeenCalled();
  });

  it('should not render FavoriteNavItems for home section in non-admin perspective', () => {
    const homeSection = createNavSectionExtension('home', 'Home');
    ((isNavSection as unknown) as jest.Mock).mockReturnValue(true);

    renderWithPerspective(<PluginNavItem extension={homeSection} />, 'dev');

    expect(MockFavoriteNavItems).not.toHaveBeenCalled();
  });

  it('should render separator with presentation role', () => {
    const separatorExtension = createSeparatorExtension('sep-1');
    ((isSeparator as unknown) as jest.Mock).mockReturnValue(true);

    renderWithPerspective(<PluginNavItem extension={separatorExtension} />);

    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('should render NavItemHref for href extension', () => {
    const hrefExtension = createHrefExtension('dashboard', 'Dashboard');
    ((isHrefNavItem as unknown) as jest.Mock).mockReturnValue(true);

    renderWithPerspective(<PluginNavItem extension={hrefExtension} />);

    expect(MockNavItemHref).toHaveBeenCalled();
    expect(screen.getByText('Dashboard')).toBeVisible();
  });

  it('should render NavItemResource for resource extension', () => {
    const resourceExtension = createResourceExtension('pods', 'Pods');
    ((isResourceNavItem as unknown) as jest.Mock).mockReturnValue(true);
    ((isResourceNSNavItem as unknown) as jest.Mock).mockReturnValue(true);

    renderWithPerspective(<PluginNavItem extension={resourceExtension} />);

    expect(MockNavItemResource).toHaveBeenCalled();
    expect(screen.getByText('Pods')).toBeVisible();
  });

  it('should return null and warn for unrecognized extension', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const unknownExtension = ({
      type: 'console.navigation/unknown',
      uid: 'uid-unknown',
      properties: { id: 'unknown' },
    } as unknown) as LoadedExtension<NavSectionType>;

    renderWithPerspective(<PluginNavItem extension={unknownExtension} />);

    expect(MockNavSection).not.toHaveBeenCalled();
    expect(MockFavoriteNavItems).not.toHaveBeenCalled();
    expect(MockNavItemHref).not.toHaveBeenCalled();
    expect(MockNavItemResource).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid or unrecognized navigation extension:',
      unknownExtension,
    );
    consoleSpy.mockRestore();
  });

  it('should not render FavoriteNavItems for non-home sections', () => {
    const workloadsSection = createNavSectionExtension('workloads', 'Workloads');
    ((isNavSection as unknown) as jest.Mock).mockReturnValue(true);

    renderWithPerspective(<PluginNavItem extension={workloadsSection} />);

    expect(MockFavoriteNavItems).not.toHaveBeenCalled();
  });
});
