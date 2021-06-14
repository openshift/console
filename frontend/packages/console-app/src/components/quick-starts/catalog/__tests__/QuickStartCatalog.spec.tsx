import * as React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { EmptyBox } from '@console/internal/components/utils';
import { getQuickStarts } from '../../utils/quick-start-utils';
import QuickStartCatalog from '../QuickStartCatalog';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: () => new Map(),
  };
});

describe('QuickStartCatalog', () => {
  it('should load an emptybox if no QS exist', () => {
    const QuickStartCatalogProps = { quickStarts: [], onClick: jest.fn() };
    const QuickStartCatalogWrapper = shallow(<QuickStartCatalog {...QuickStartCatalogProps} />);
    expect(QuickStartCatalogWrapper.find(EmptyBox).exists()).toBeTruthy();
  });
  it('should load a gallery if QS exist', () => {
    const QuickStartCatalogProps = { quickStarts: getQuickStarts(), onClick: jest.fn() };
    const QuickStartCatalogWrapper = shallow(<QuickStartCatalog {...QuickStartCatalogProps} />);
    expect(QuickStartCatalogWrapper.find(Gallery).exists()).toBeTruthy();
  });
  it('should load galleryItems equal to the number of QS', () => {
    const QuickStartCatalogProps = { quickStarts: getQuickStarts(), onClick: jest.fn() };
    const QuickStartCatalogWrapper = shallow(<QuickStartCatalog {...QuickStartCatalogProps} />);
    const galleryItems = QuickStartCatalogWrapper.find(GalleryItem);
    expect(galleryItems.exists()).toBeTruthy();
    expect(galleryItems.length).toEqual(getQuickStarts().length);
  });
});
