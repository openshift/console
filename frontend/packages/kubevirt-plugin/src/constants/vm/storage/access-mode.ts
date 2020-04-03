/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';

export class AccessMode extends ObjectEnum<string> {
  static readonly READ_WRITE_ONCE = new AccessMode('ReadWriteOnce', 'Single User (RWO)');
  static readonly READ_WRITE_MANY = new AccessMode('ReadWriteMany', 'Shared Access (RWX)');
  static readonly READ_ONLY_MANY = new AccessMode('ReadOnlyMany', 'Read Only (ROX)');

  private readonly label: string;

  protected constructor(value: string, label: string) {
    super(value);
    this.label = label;
  }

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

  toString = () => {
    return this.label;
  };
}
