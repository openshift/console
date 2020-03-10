import * as _ from 'lodash';
import {
  SmoothieWrapper,
  SmoothieType,
  CombinedExclusiveFlavorTypeData,
} from './mocks/smoothie-wrapper';

describe('ObjectWithTypePropertyWrapper methods', () => {
  let emptySmoothie: SmoothieWrapper = null;
  let orangeSmoothie: SmoothieWrapper = null;
  let orangeTypeData: CombinedExclusiveFlavorTypeData = null;

  const getOrangeTypeData = () => ({
    color: 'orange',
    seeds: {
      count: 7,
    },
  });

  const getOrangeSmoothie = () =>
    new SmoothieWrapper({
      attributes: {
        exclusiveFlavor: {
          orange: getOrangeTypeData(),
        },
      },
    });

  const getAllSmoothies = () => [
    new SmoothieWrapper(),
    new SmoothieWrapper({
      attributes: {
        exclusiveFlavor: {
          blueberry: { color: 'blue' },
        },
      },
    }),
    getOrangeSmoothie(),
  ];

  beforeEach(() => {
    emptySmoothie = new SmoothieWrapper();
    orangeTypeData = getOrangeTypeData();
    orangeSmoothie = getOrangeSmoothie();
  });

  it('reports values correctly', () => {
    expect(orangeSmoothie.getType()).toBe(SmoothieType.ORANGE);
    expect(orangeSmoothie.getTypeData()).toEqual(orangeTypeData);
    expect(orangeSmoothie.getTypeData(SmoothieType.BLUEBERRY)).toBe(undefined);
    expect(orangeSmoothie.getTypeValue()).toEqual('orange');
    expect(orangeSmoothie.hasType()).toBe(true);
    expect(orangeSmoothie.asResource()).toEqual({
      attributes: {
        exclusiveFlavor: {
          orange: orangeTypeData,
        },
      },
    });

    expect(emptySmoothie.getType()).toBe(undefined);
    expect(emptySmoothie.getTypeData()).toBe(undefined);
    expect(emptySmoothie.getTypeData(SmoothieType.BLUEBERRY)).toBe(undefined);
    expect(emptySmoothie.getTypeValue()).toBe(undefined);
    expect(emptySmoothie.hasType()).toBe(false);
    expect(emptySmoothie.asResource()).toEqual({});
  });

  describe('sets correct type', () => {
    getAllSmoothies().forEach((smoothie: SmoothieWrapper) => {
      it(` for ${smoothie.getType() || 'empty'}`, () => {
        smoothie.setType(SmoothieType.BANANA);
        expect(smoothie.getType()).toBe(SmoothieType.BANANA);
        expect(smoothie.getTypeData(SmoothieType.BANANA)).toEqual({});
        expect(smoothie.asResource()).toEqual({
          attributes: {
            exclusiveFlavor: {
              banana: {},
            },
          },
        });
      });
    });
  });

  describe('sets correct type with type data', () => {
    getAllSmoothies().forEach((smoothie: SmoothieWrapper) => {
      it(` for ${smoothie.getType() || 'empty'}`, () => {
        smoothie.setType(SmoothieType.STRAWBERRY, { color: 'red' });
        expect(smoothie.getType()).toBe(SmoothieType.STRAWBERRY);
        expect(smoothie.getTypeData()).toEqual({ color: 'red' });
        expect(smoothie.asResource()).toEqual({
          attributes: {
            exclusiveFlavor: {
              strawberry: { color: 'red' },
            },
          },
        });
      });
    });
  });

  it('sets correct type data', () => {
    orangeSmoothie.setTypeData({ color: 'green' });
    expect(orangeSmoothie.getType()).toBe(SmoothieType.ORANGE);
    expect(orangeSmoothie.getTypeData()).toEqual({ color: 'green' });
    expect(orangeSmoothie.asResource()).toEqual({
      attributes: {
        exclusiveFlavor: {
          orange: { color: 'green' },
        },
      },
    });
  });

  it('appends correct type data', () => {
    orangeSmoothie.asResource().attributes.price = {
      value: 2,
      currency: 'CZK',
    };
    orangeSmoothie.appendTypeData({ color: 'green' });
    expect(orangeSmoothie.getTypeData()).toEqual({ ...orangeTypeData, color: 'green' });

    orangeSmoothie
      .appendType(SmoothieType.BANANA, { color: 'yellow' })
      .appendType(SmoothieType.BANANA, { peel: { thickness: '3' } })
      .appendType(SmoothieType.BANANA, {});

    expect(orangeSmoothie.asResource()).toEqual({
      attributes: {
        price: {
          value: 2,
          currency: 'CZK',
        },
        exclusiveFlavor: {
          banana: { color: 'yellow', peel: { thickness: '3' } },
        },
      },
    });
  });

  it('appends correct type data for empty', () => {
    emptySmoothie.appendTypeData({ color: 'green' });
    expect(emptySmoothie.asResource()).toEqual({});
    emptySmoothie.appendType(SmoothieType.BANANA, { color: 'green' });
    expect(emptySmoothie.getTypeData()).toEqual({ color: 'green' });
  });

  it('set type data sanitize works', () => {
    orangeSmoothie.setTypeData({ color: 'green', peel: { thickness: '5' } });
    expect(orangeSmoothie.asResource()).toEqual({
      attributes: {
        exclusiveFlavor: {
          orange: { color: 'green' },
        },
      },
    });
    emptySmoothie.setType(SmoothieType.STRAWBERRY, { color: 'red', seeds: { count: 3 } });
    expect(emptySmoothie.getTypeData()).toEqual({ color: 'red' });
  });

  it('append type data sanitize works', () => {
    orangeSmoothie
      .appendTypeData({ color: 'green', peel: { thickness: '5' } })
      .appendType(SmoothieType.ORANGE, { peel: { thickness: '4' } });
    expect(orangeSmoothie.asResource()).toEqual({
      attributes: {
        exclusiveFlavor: {
          orange: { ...orangeTypeData, color: 'green' },
        },
      },
    });
  });

  it('set type data sanitize off', () => {
    orangeSmoothie.setTypeData({ color: 'green', peel: { thickness: '5' } }, false);
    expect(orangeSmoothie.asResource()).toEqual({
      attributes: {
        exclusiveFlavor: {
          orange: { color: 'green', peel: { thickness: '5' } },
        },
      },
    });
    emptySmoothie.setType(SmoothieType.STRAWBERRY, { color: 'red', seeds: { count: 3 } }, false);
    expect(emptySmoothie.getTypeData()).toEqual({ color: 'red', seeds: { count: 3 } });
  });

  it('append type data sanitize off', () => {
    orangeSmoothie.appendTypeData({ color: 'green', peel: { thickness: '5' } }, false);
    expect(orangeSmoothie.asResource()).toEqual({
      attributes: {
        exclusiveFlavor: {
          orange: { ...orangeTypeData, color: 'green', peel: { thickness: '5' } },
        },
      },
    });
  });

  it('stores inconsistent data', () => {
    const data = {
      attributes: {
        exclusiveFlavor: {
          orange: { color: 'orange', seeds: { count: 6 } },
          blueberry: { color: 'blue' },
          strawberry: { color: 'red' },
        },
      },
    };
    // no changes occur to the underlying data when we just store it and retrieve afterwards
    expect(new SmoothieWrapper(_.cloneDeep(data)).asResource()).toEqual(data);

    // makes them consistent
    expect(
      new SmoothieWrapper(_.cloneDeep(data)).appendType(SmoothieType.BLUEBERRY).asResource(),
    ).toEqual({
      attributes: {
        exclusiveFlavor: {
          blueberry: { color: 'blue' },
        },
      },
    });
  });

  it('merges types smoothly', () => {
    expect(
      new SmoothieWrapper().mergeWith(...getAllSmoothies(), getOrangeSmoothie()).asResource(),
    ).toEqual(getOrangeSmoothie().asResource());

    expect(
      new SmoothieWrapper({ attributes: { exclusiveFlavor: { blueberry: { color: 'green' } } } })
        .mergeWith(
          new SmoothieWrapper({
            attributes: { exclusiveFlavor: { blueberry: { color: 'blue' } } },
          }),
          new SmoothieWrapper({
            attributes: { exclusiveFlavor: { banana: { color: 'yellow' } } },
          }),
          new SmoothieWrapper({
            attributes: { exclusiveFlavor: { banana: { peel: { thickness: '3' } } } },
          }),
        )
        .mergeWith(
          new SmoothieWrapper({
            attributes: { exclusiveFlavor: { banana: { peel: { thickness: '5' } } } },
          }),
        )
        .asResource(),
    ).toEqual({
      attributes: { exclusiveFlavor: { banana: { color: 'yellow', peel: { thickness: '5' } } } },
    });
  });
});
