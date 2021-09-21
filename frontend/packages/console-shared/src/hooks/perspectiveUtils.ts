import { PerspectiveType } from '@console/dynamic-plugin-sdk';
import { USERSETTINGS_PREFIX } from '../constants';

const PERSPECTIVE_VISITED_FEATURE_KEY = 'perspective.visited';

export const getPerspectiveVisitedKey = (perspective: PerspectiveType): string =>
  `${USERSETTINGS_PREFIX}.${PERSPECTIVE_VISITED_FEATURE_KEY}.${perspective}`;
