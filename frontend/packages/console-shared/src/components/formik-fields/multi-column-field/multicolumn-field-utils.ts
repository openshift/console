import { gridItemSpanValueShape } from '@patternfly/react-core';
import * as _ from 'lodash';

export const getSpans = (totalFieldCount: gridItemSpanValueShape): gridItemSpanValueShape[] => {
  const spans: gridItemSpanValueShape[] = _.fill(
    Array(totalFieldCount),
    Math.trunc(12 / totalFieldCount),
  ) as gridItemSpanValueShape[];

  let remainder = 12 % totalFieldCount;

  while (remainder--) {
    spans[remainder]++;
  }

  return spans;
};
