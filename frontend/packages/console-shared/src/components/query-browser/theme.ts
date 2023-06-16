import { ChartThemeColor, ChartThemeVariant, getCustomTheme } from '@patternfly/react-charts';
import { global_palette_black_300 as globalBlack300 } from '@patternfly/react-tokens/dist/js/global_palette_black_300';

const pfDependentAxisTickLabels = {
  padding: 5,
  fontFamily: 'var(--pf-chart-global--FontFamily)',
  letterSpacing: 'var(--pf-chart-global--letter-spacing)',
  fill: 'var(--pf-global--Color--200)',
};

const theme = {
  chart: {
    padding: {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
    },
  },
  dependentAxis: {
    style: {
      axis: {
        stroke: 'none',
      },
      grid: {
        stroke: '#EDEDED',
      },
      tickLabels: pfDependentAxisTickLabels,
    },
  },
  independentAxis: {
    style: {
      ticks: {
        size: 5,
        strokeWidth: 1,
        stroke: globalBlack300.value,
      },
      tickLabels: Object.assign({}, pfDependentAxisTickLabels, { padding: 2 }),
      grid: {
        stroke: 'none',
      },
    },
  },
  line: {
    style: {
      data: {
        opacity: 0.75,
      },
    },
  },
};

export const queryBrowserTheme = getCustomTheme(
  ChartThemeColor.multiUnordered,
  ChartThemeVariant.light,
  theme,
);
