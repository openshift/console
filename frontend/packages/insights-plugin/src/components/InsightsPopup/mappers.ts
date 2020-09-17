/* eslint-disable @typescript-eslint/camelcase */
import {
  global_palette_blue_50,
  global_palette_blue_300,
  global_palette_gold_400,
  global_palette_orange_300,
  global_palette_red_200,
} from '@patternfly/react-tokens';
import { AngleDoubleDownIcon, AngleDoubleUpIcon, EqualsIcon } from '@patternfly/react-icons';
import CriticalIcon from './CriticalIcon';

export const riskIcons = {
  low: AngleDoubleDownIcon,
  moderate: EqualsIcon,
  important: AngleDoubleUpIcon,
  critical: CriticalIcon,
};

export const colorScale = [
  global_palette_blue_50.value,
  global_palette_gold_400.value,
  global_palette_orange_300.value,
  global_palette_red_200.value,
];

export const legendColorScale = {
  low: global_palette_blue_300.value,
  moderate: global_palette_gold_400.value,
  important: global_palette_orange_300.value,
  critical: global_palette_red_200.value,
};

export const riskSorting = {
  low: 0,
  moderate: 1,
  important: 2,
  critical: 3,
};
