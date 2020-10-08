import { ObjectEnum } from '@console/shared/src/constants/object-enum';
import { ObjectWithTypePropertyWrapper } from '../../object-with-type-property-wrapper';

export type Smoothie = {
  attributes: {
    price?: {
      value: number;
      currency: string;
    };
    exclusiveFlavor: {
      banana?: {
        color?: string;
        peel?: {
          thickness: string;
        };
      };
      orange?: {
        color?: string;
        seeds?: {
          count: number;
        };
      };
      blueberry?: {
        color?: string;
      };
      strawberry?: {
        color?: string;
      };
    };
  };
};

export type CombinedExclusiveFlavorTypeData = {
  color?: string;
  peel?: {
    thickness: string;
  };
  seeds?: {
    count: number;
  };
};

export class SmoothieType extends ObjectEnum<string> {
  static readonly STRAWBERRY = new SmoothieType('strawberry');

  static readonly BANANA = new SmoothieType('banana');

  static readonly ORANGE = new SmoothieType('orange');

  static readonly BLUEBERRY = new SmoothieType('blueberry');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<SmoothieType>(SmoothieType),
  );

  static getAll = () => SmoothieType.ALL;
}

export class SmoothieWrapper extends ObjectWithTypePropertyWrapper<
  Smoothie,
  SmoothieType,
  CombinedExclusiveFlavorTypeData,
  SmoothieWrapper
> {
  constructor(data?: Smoothie | SmoothieWrapper, copy = false) {
    super(data, copy, SmoothieType, ['attributes', 'exclusiveFlavor']);
  }

  protected sanitize(
    type: SmoothieType,
    typeData: CombinedExclusiveFlavorTypeData,
  ): CombinedExclusiveFlavorTypeData {
    const result: CombinedExclusiveFlavorTypeData = {};
    if (typeData.color) {
      result.color = typeData.color;
    }
    if (type === SmoothieType.BANANA && typeData.peel) {
      result.peel = { thickness: typeData.peel.thickness };
    }
    if (type === SmoothieType.ORANGE && typeData.seeds) {
      result.seeds = { count: typeData.seeds.count };
    }
    return result;
  }
}
