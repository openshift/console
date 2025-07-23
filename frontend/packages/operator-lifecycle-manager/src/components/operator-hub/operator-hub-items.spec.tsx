import { determineCategories, orderAndSortByRelevance } from './operator-hub-items';
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

describe('orderAndSortByRelevance', () => {
  it('sorts Red Hat items before non-Red Hat items', () => {
    const items = [
      { name: 'B Operator', provider: 'Other' },
      { name: 'A Operator', provider: 'Red Hat' },
      { name: 'C Operator', provider: 'Red Hat, Inc.' },
      { name: 'D Operator', provider: 'Another' },
    ];
    const sortedItems = orderAndSortByRelevance(items);
    expect(sortedItems[0].provider).toBe('Red Hat');
    expect(sortedItems[1].provider).toBe('Red Hat, Inc.');
    expect(sortedItems[2].provider).not.toBe('Red Hat');
    expect(sortedItems[3].provider).not.toBe('Red Hat');
  });

  it('sorts items alphabetically within each provider group', () => {
    const items = [
      { name: 'Z Operator', provider: 'Other' },
      { name: 'B Operator', provider: 'Red Hat' },
      { name: 'A Operator', provider: 'Red Hat, Inc.' },
      { name: 'Y Operator', provider: 'Another' },
    ];
    const sortedItems = orderAndSortByRelevance(items);
    expect(sortedItems[0].name).toBe('A Operator');
    expect(sortedItems[1].name).toBe('B Operator');
    expect(sortedItems[2].name).toBe('Y Operator');
    expect(sortedItems[3].name).toBe('Z Operator');
  });
});
