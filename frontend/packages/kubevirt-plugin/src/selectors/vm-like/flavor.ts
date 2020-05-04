import * as _ from 'lodash';
import { CUSTOM_FLAVOR } from '../../constants/vm';

export const isCustomFlavor = (flavor: string) =>
  !flavor || flavor?.toLowerCase() === CUSTOM_FLAVOR.toLowerCase();

// UI representation of flavor tiny|small|medium|large|Custom
export const toUIFlavor = (flavor: string) => (isCustomFlavor(flavor) ? CUSTOM_FLAVOR : flavor);
export const toUIFlavorLabel = (flavor: string) => _.capitalize(toUIFlavor(flavor));
