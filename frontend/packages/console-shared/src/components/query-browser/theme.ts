import { ChartThemeColor, getCustomTheme } from '@patternfly/react-charts/victory';
import { t_color_gray_30 as globalBlack300 } from '@patternfly/react-tokens';

const pfDependentAxisTickLabels = {
  padding: 5,
  fontFamily: 'var(--pf-v6-chart-global--FontFamily)',
  letterSpacing: 'var(--pf-v6-chart-global--letter-spacing)',
  fill: 'var(--pf-t--global--text--color--subtle)',
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

export const queryBrowserTheme = getCustomTheme(ChartThemeColor.multiUnordered, theme);
