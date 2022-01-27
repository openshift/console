import { LightMultiColorOrderedTheme } from '@patternfly/react-charts/dist/js/components/ChartTheme/themes/light/multi-color-ordered-theme';
import * as _ from 'lodash';

const swapArrayElems = (arr) => ([arr[0], arr[1]] = [arr[1], arr[0]]);

export const getColorList = (numColors: number) => {
  const originalColors = LightMultiColorOrderedTheme.pie.colorScale;
  const numOriginalColors = originalColors.length;
  const colorList = [].concat(originalColors);

  if (numColors > numOriginalColors) {
    // assemble an array of the required size by repeating colors
    const fullMultiples = numColors / numOriginalColors;
    const remainder = numColors % numOriginalColors;

    // add full shuffled copies of the original list
    for (let i = 1; i <= fullMultiples; i++) {
      const shuffledColors = _.shuffle([].concat(originalColors));
      if (shuffledColors[0] === colorList[colorList.length - 1]) {
        // swap colors to avoid adjoining colors being equal
        swapArrayElems(shuffledColors);
      }
      colorList.concat(shuffledColors);
    }

    // add a shuffled slice of the original list to meet length requirement
    if (remainder) {
      const shuffledRemainder = _.shuffle(originalColors.slice(0, remainder));
      if (remainder > 1 && shuffledRemainder[0] === colorList[colorList.length - 1]) {
        // swap colors to avoid adjoining colors being equal
        swapArrayElems(shuffledRemainder);
      }
      colorList.concat(shuffledRemainder);
    }
  }

  return colorList;
};
