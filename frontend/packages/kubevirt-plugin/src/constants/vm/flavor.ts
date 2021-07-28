/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../object-enum';
import { SelectDropdownObjectEnum } from '../select-dropdown-object-enum';

export class Flavor extends SelectDropdownObjectEnum<string> {
  static readonly TINY = new Flavor('tiny', {
    // t('kubevirt-plugin~Tiny')
    labelKey: 'kubevirt-plugin~Tiny',
    order: 1,
  });
  static readonly SMALL = new Flavor('small', {
    // t('kubevirt-plugin~Small')
    labelKey: 'kubevirt-plugin~Small',
    order: 2,
  });
  static readonly MEDIUM = new Flavor('medium', {
    // t('kubevirt-plugin~Medium')
    labelKey: 'kubevirt-plugin~Medium',
    order: 3,
  });
  static readonly LARGE = new Flavor('large', {
    // t('kubevirt-plugin~Large')
    labelKey: 'kubevirt-plugin~Large',
    order: 4,
  });
  static readonly CUSTOM = new Flavor('Custom', {
    // t('kubevirt-plugin~Custom')
    labelKey: 'kubevirt-plugin~Custom',
    // t('kubevirt-plugin~Enter CPU and Memory values')
    descriptionKey: 'kubevirt-plugin~Enter CPU and Memory values',
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
