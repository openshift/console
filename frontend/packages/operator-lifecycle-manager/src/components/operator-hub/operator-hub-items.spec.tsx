import * as React from 'react';
// //import { CatalogItemHeader, CatalogTile } from '@patternfly/react-catalog-view-extension';
import { render, screen } from '@testing-library/react';
import { mount, ReactWrapper } from 'enzyme';
// import { Provider } from 'react-redux';
// import { MemoryRouter } from 'react-router-dom';
// import { Router } from 'react-router-dom-v5-compat';
// import { history } from '@console/internal/components/utils';
// import store from '@console/internal/redux';
import {
  operatorHubListPageProps,
  // operatorHubTileViewPageProps,
  operatorHubTileViewPagePropsWithDummy,
  // mockFilterStrings,
  // mockProviderStrings,
  // operatorHubDetailsProps,
  // itemWithLongDescription,
  // filterCounts,
} from '../../../mocks';
import { OperatorHubItemDetailsProps } from './operator-hub-item-details';
import {
  determineCategories,
  OperatorHubTile,
  // OperatorHubTileView,
  // OperatorHubTileViewProps,
} from './operator-hub-items';
import { OperatorHubItem } from './index';

describe('determineCategories', () => {
  it('should merge categories by name', () => {
    const operatorHubItems: OperatorHubItem[] = [
      {
        categories: ['a-category'],
      } as OperatorHubItem,
      {
        categories: ['a-category', 'b-category'],
      } as OperatorHubItem,
    ];
    const actualCategories = determineCategories(operatorHubItems);
    const expectedCategories = {
      'a-category': {
        id: 'a-category',
        label: 'a-category',
        field: 'categories',
        values: ['a-category'],
      },
      'b-category': {
        id: 'b-category',
        label: 'b-category',
        field: 'categories',
        values: ['b-category'],
      },
    };
    expect(actualCategories).toEqual(expectedCategories);
  });

  it('should sort categories by name', () => {
    const operatorHubItems: OperatorHubItem[] = [
      {
        categories: ['c-category'],
      } as OperatorHubItem,
      {
        categories: ['d-category', 'b-category'],
      } as OperatorHubItem,
      {
        categories: ['a-category'],
      } as OperatorHubItem,
    ];
    const actualCategories = determineCategories(operatorHubItems);
    const expectedCategories = {
      'a-category': {
        id: 'a-category',
        label: 'a-category',
        field: 'categories',
        values: ['a-category'],
      },
      'b-category': {
        id: 'b-category',
        label: 'b-category',
        field: 'categories',
        values: ['b-category'],
      },
      'c-category': {
        id: 'c-category',
        label: 'c-category',
        field: 'categories',
        values: ['c-category'],
      },
      'd-category': {
        id: 'd-category',
        label: 'd-category',
        field: 'categories',
        values: ['d-category'],
      },
    };
    expect(actualCategories).toEqual(expectedCategories);
  });

  it('should not return categories if there is no defined', () => {
    const operatorHubItems: OperatorHubItem[] = [
      // No categories attribute
      {} as OperatorHubItem,
      // Empty categories array
      {
        categories: [],
      } as OperatorHubItem,
    ];
    const actualCategories = determineCategories(operatorHubItems);
    const expectedCategories = {};
    expect(actualCategories).toEqual(expectedCategories);
  });

  it('should not return category if string is empty', () => {
    const operatorHubItems: OperatorHubItem[] = [
      {
        categories: ['a-category', ''],
      } as OperatorHubItem,
      {
        categories: [null, '', 'a-category'],
      } as OperatorHubItem,
    ];
    const actualCategories = determineCategories(operatorHubItems);
    const expectedCategories = {
      'a-category': {
        id: 'a-category',
        label: 'a-category',
        field: 'categories',
        values: ['a-category'],
      },
    };
    expect(actualCategories).toEqual(expectedCategories);
  });
});

describe(OperatorHubTile.displayName, () => {
  const wrapper: ReactWrapper<OperatorHubItemDetailsProps> = mount(
    <OperatorHubTile
      updateChannel={''}
      item={operatorHubTileViewPagePropsWithDummy.items[0]}
      onClick={null}
    />,
  );

  it('renders amq-streams tile with correct deprecation package props', () => {
    const amqPackageManifest = operatorHubListPageProps.packageManifests.data[0];
    const amqTileProps = wrapper.find<any>(CatalogTile);
    const vendorAndDeprecated = amqTileProps.at(0).props();
    const deprecationProps = vendorAndDeprecated.vendor.props.children[1];
    expect(deprecationProps.props.children.props.deprecation.message).toEqual(
      amqPackageManifest.status.deprecation.message,
    );
  });
});

describe(OperatorHubTile.displayName, () => {
  it('rtl renders amq-streams tile with correct deprecation package props', () => {
    //   const amqPackageManifest = operatorHubListPageProps.packageManifests.data[0];

    render(
      <OperatorHubTile
        updateChannel={''}
        item={operatorHubTileViewPagePropsWithDummy.items[0]}
        onClick={null}
      />,
    );

    //  const amqTile = screen.getByRole(CatalogTile); // or whatever the role of your CatalogTile is
    // const vendorAndDeprecated = amqTile.textContent;
    const textElement = screen.getByText('Deprecated');
    //  const deprecationMessage = vendorAndDeprecated.split(' ')[1]; // assuming the deprecation message is the second part of the textContent
    expect(textElement).toEqual('Deprecated');
    //  expect(deprecationMessage).toEqual(amqPackageManifest.status.deprecation.message);
  });
});

// describe(OperatorHubTile.displayName, () => {
//   const wrapper: ReactWrapper<OperatorHubTileViewProps> = mount(
//     <OperatorHubTileView items={operatorHubTileViewPagePropsWithDummy.items} />,
//     {
//       wrappingComponent: ({ children }) => (
//         <MemoryRouter history={history}>
//           <Provider store={store}>{children}</Provider>
//         </MemoryRouter>
//       ),
//     },
//   );

//   it('renders amq-streams tile with correct deprecation package props', () => {
//     const amqPackageManifest = operatorHubListPageProps.packageManifests.data[0];
//     const amqTileProps = wrapper.find<any>(CatalogItemHeader);
//     const vendorAndDeprecated = amqTileProps.at(0).props();
//     const deprecationProps = vendorAndDeprecated.title.props.children[1];
//     // / console.log("deprecationProps", deprecationProps)
//     expect(deprecationProps.props.children.props.deprecation.message).toEqual(
//       amqPackageManifest.status.deprecation.message,
//     );
//   });
// });
