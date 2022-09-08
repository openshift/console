import { global_palette_black_300 as globalBlack300 } from '@patternfly/react-tokens/dist/js/global_palette_black_300';

const pfDependentAxisTickLabels = {
  padding: 5,
  fontFamily: 'var(--pf-chart-global--FontFamily)',
  letterSpacing: 'var(--pf-chart-global--letter-spacing)',
  fill: 'var(--pf-global--Color--200)',
};
const axisTicks = {
  size: 5,
  strokeWidth: 1,
  stroke: globalBlack300.value,
};

export const areaTheme = {
  area: {
    style: {
      data: {
        fillOpacity: 0.15,
      },
    },
  },
  chart: {
    padding: {
      bottom: 30,
      left: 60,
      right: 10,
      top: 0,
    },
  },
  dependentAxis: {
    style: {
      axis: {
        stroke: 'EDEDED',
        strokeWidth: 2,
      },
      grid: { stroke: '#EDEDED' },
      tickLabels: pfDependentAxisTickLabels,
      ticks: axisTicks,
    },
  },
};

export const barTheme = {
  bar: {
    style: {
      labels: {
        textAnchor: 'end' as 'end',
      },
    },
  },
  dependentAxis: {
    style: {
      axis: {
        stroke: 'none',
      },
      tickLabels: {
        fill: 'none',
      },
    },
  },
  independentAxis: {
    style: {
      axis: {
        stroke: 'none',
      },
      tickLabels: {
        textAnchor: 'start' as 'start',
      },
    },
  },
};
