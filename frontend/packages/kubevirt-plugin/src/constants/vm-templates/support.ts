import { ObjectEnum } from '../object-enum';
import { SelectDropdownObjectEnum } from '../select-dropdown-object-enum';

export class TemplateSupport extends SelectDropdownObjectEnum<string> {
  // t('kubevirt-plugin~No additional support')
  static readonly NO_SUPPORT = new TemplateSupport('NO_SUPPORT', {
    labelKey: 'kubevirt-plugin~No additional support',
  });

  // t('kubevirt-plugin~Support by template provider')
  static readonly FULL_SUPPORT = new TemplateSupport('Full', {
    labelKey: 'kubevirt-plugin~Support by template provider',
  });

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<TemplateSupport>(TemplateSupport),
  );

  private static readonly stringMapper = TemplateSupport.ALL.reduce(
    (accumulator, support: TemplateSupport) => ({
      ...accumulator,
      [support.value]: support,
    }),
    {},
  );

  static getAll = () => TemplateSupport.ALL;

  static fromString = (source: string): TemplateSupport => TemplateSupport.stringMapper[source];
}
