/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';
import { SelectDropdownObjectEnum } from '../select-dropdown-object-enum';
import {
  FLAVOR_TINY_DESC,
  FLAVOR_SMALL_DESC,
  FLAVOR_MEDIUM_DESC,
  FLAVOR_LARGE_DESC,
  FLAVOR_CUSTOM_DESC,
} from '../../utils/strings';

export class Flavor extends SelectDropdownObjectEnum<string> {
  static readonly TINY = new Flavor('tiny', {
    label: 'Tiny',
    description: FLAVOR_TINY_DESC,
    order: 1,
  });
  static readonly SMALL = new Flavor('small', {
    label: 'Small',
    description: FLAVOR_SMALL_DESC,
    order: 2,
  });
  static readonly MEDIUM = new Flavor('medium', {
    label: 'Medium',
    description: FLAVOR_MEDIUM_DESC,
    order: 3,
  });
  static readonly LARGE = new Flavor('large', {
    label: 'Large',
    description: FLAVOR_LARGE_DESC,
    order: 4,
  });
  static readonly CUSTOM = new Flavor('Custom', {
    description: FLAVOR_CUSTOM_DESC,
    order: 5,
  });

  private static readonly ALL = Object.freeze(ObjectEnum.getAllClassEnumProperties<Flavor>(Flavor));

  private static readonly stringMapper = Flavor.ALL.reduce(
    (accumulator, flavor: Flavor) => ({
      ...accumulator,
      [flavor.value]: flavor,
    }),
    {},
  );

  static getAll = () => Flavor.ALL;

  static fromString = (source: string): Flavor => Flavor.stringMapper[source];
}
