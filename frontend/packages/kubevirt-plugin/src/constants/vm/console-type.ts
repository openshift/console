/* eslint-disable lines-between-class-members */
import { AccessConsoles } from '@patternfly/react-console/dist/js';
import { ObjectEnum } from '../object-enum';

const {
  VNC_CONSOLE_TYPE,
  SERIAL_CONSOLE_TYPE,
  DESKTOP_VIEWER_CONSOLE_TYPE,
  RDP_CONSOLE_TYPE,
} = AccessConsoles.constants;

export class ConsoleType extends ObjectEnum<string> {
  static readonly VNC = new ConsoleType('vnc', VNC_CONSOLE_TYPE);
  static readonly RDP = new ConsoleType('rdp', RDP_CONSOLE_TYPE);
  static readonly SERIAL = new ConsoleType('serial', SERIAL_CONSOLE_TYPE);
  static readonly DESKTOP_VIEWER = new ConsoleType('desktop-viewer', DESKTOP_VIEWER_CONSOLE_TYPE);

  private readonly patternflyLabel: string;

  protected constructor(value: string, patternflyLabel: string) {
    super(value);
    this.patternflyLabel = patternflyLabel;
  }

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<ConsoleType>(ConsoleType),
  );

  private static readonly stringMapper = ConsoleType.ALL.reduce(
    (accumulator, consoleType: ConsoleType) => ({
      ...accumulator,
      [consoleType.value]: consoleType,
    }),
    {},
  );

  static getAll = () => ConsoleType.ALL;

  static fromString = (model: string): ConsoleType => ConsoleType.stringMapper[model];

  toPatternflyLabel() {
    return this.patternflyLabel;
  }
}
