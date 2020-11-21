import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow } from 'enzyme';
import { CardActions, Dropdown, CardBody, CardFooter, Button } from '@patternfly/react-core';
import { getQuickStarts } from '@console/app/src/components/quick-starts/utils/quick-start-utils';
import { InternalQuickStartsCatalogCard as QuickStartsCatalogCard } from '../QuickStartsCatalogCard';
import { HIDE_QUICK_START_ADD_TILE_STORAGE_KEY } from '../quick-starts-catalog-card-constants';

const mockQuickStarts = getQuickStarts();

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('QuickStartsCatalogCard', () => {
  const QuickStartTileWrapper = shallow(
    <QuickStartsCatalogCard
      quickStarts={mockQuickStarts}
      storageKey={HIDE_QUICK_START_ADD_TILE_STORAGE_KEY}
    />,
  );

  it('should show proper CardAction', () => {
    const cardAction = QuickStartTileWrapper.find(CardActions);
    expect(cardAction.exists()).toBe(true);
    expect(cardAction.find(Dropdown).prop('dropdownItems').length).toEqual(1);
  });

  it('should show 3 tour links', () => {
    const cardBody = QuickStartTileWrapper.find(CardBody);
    expect(cardBody.exists()).toBe(true);
    expect(cardBody.find(Button).length).toEqual(3);
  });

  it('should show a footer link to QuickStartCatalog', () => {
    const cardFooter = QuickStartTileWrapper.find(CardFooter);
    expect(cardFooter.exists()).toBe(true);
    expect(cardFooter.find(Link).exists()).toBe(true);
    expect(cardFooter.find(Link).prop('to')).toEqual('/quickstart');
  });

  it('should hide QuickStartsCatalogCard when localStorage is set', () => {
    localStorage.setItem(HIDE_QUICK_START_ADD_TILE_STORAGE_KEY, 'true');
    const emptyWrapper = shallow(
      <QuickStartsCatalogCard
        quickStarts={mockQuickStarts}
        storageKey={HIDE_QUICK_START_ADD_TILE_STORAGE_KEY}
      />,
    );
    expect(emptyWrapper.find(QuickStartsCatalogCard).exists()).toBe(false);
  });
});
