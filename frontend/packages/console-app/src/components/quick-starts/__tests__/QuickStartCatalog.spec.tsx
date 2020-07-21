import * as React from 'react';
import { shallow } from 'enzyme';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { EmptyBox } from '@console/internal/components/utils';
import { InternalQuickStartCatalog } from '../QuickStartCatalog';
import { getQuickStartsWithStatus } from '../utils/quick-start-utils';

describe('QuickStartCatalog', () => {
  it('should load an emptybox if no QS exist', () => {
    const QuickStartCatalogProps = { quickStarts: [], onClick: jest.fn() };
    const QuickStartCatalogWrapper = shallow(
      <InternalQuickStartCatalog {...QuickStartCatalogProps} />,
    );
    expect(QuickStartCatalogWrapper.find(EmptyBox).exists()).toBeTruthy();
  });
  it('should load a gallery if QS exist', () => {
    const QuickStartCatalogProps = { quickStarts: getQuickStartsWithStatus(), onClick: jest.fn() };
    const QuickStartCatalogWrapper = shallow(
      <InternalQuickStartCatalog {...QuickStartCatalogProps} />,
    );
    expect(QuickStartCatalogWrapper.find(Gallery).exists()).toBeTruthy();
  });
  it('should load galleryItems equal to the number of QS', () => {
    const QuickStartCatalogProps = { quickStarts: getQuickStartsWithStatus(), onClick: jest.fn() };
    const QuickStartCatalogWrapper = shallow(
      <InternalQuickStartCatalog {...QuickStartCatalogProps} />,
    );
    const galleryItems = QuickStartCatalogWrapper.find(GalleryItem);
    expect(galleryItems.exists()).toBeTruthy();
    expect(galleryItems.length).toEqual(3);
  });
});
