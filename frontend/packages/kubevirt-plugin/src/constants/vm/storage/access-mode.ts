/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';

export class AccessMode extends ObjectEnum<string> {
  static readonly SINGLE_USER = new AccessMode('ReadWriteOnce');
  static readonly SHARED_ACCESS = new AccessMode('ReadWriteMany');
  static readonly READ_ONLY = new AccessMode('ReadOnlyMany');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<AccessMode>(AccessMode),
  );

  private static readonly stringMapper = AccessMode.ALL.reduce(
    (accumulator, accessMode: AccessMode) => ({
      ...accumulator,
      [accessMode.value]: accessMode,
    }),
    {},
  );

  static getAll = () => AccessMode.ALL;

  static fromSerialized = (accessMode: { value: string }): AccessMode =>
    AccessMode.fromString(accessMode && accessMode.value);

  static fromString = (model: string): AccessMode => AccessMode.stringMapper[model];

  toLabel = () => {
    switch (this) {
      case AccessMode.SINGLE_USER:
        return 'Single User (RWO)';
      case AccessMode.SHARED_ACCESS:
        return 'Shared Access (RWX)';
      case AccessMode.READ_ONLY:
        return 'Read Only (ROX)';
      default:
        return this.value;
    }
  };
}
