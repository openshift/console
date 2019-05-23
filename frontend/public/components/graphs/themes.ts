/* eslint-disable camelcase */
import { global_FontFamily_sans_serif } from '@patternfly/react-tokens';

const independentAxisTheme = {
  independentAxis: {
    style: {
      axis: { stroke: '#D1D1D1' },
      tickLabels: { fontFamily: global_FontFamily_sans_serif.value },
    },
  },
};

const dependentAxisTheme = {
  dependentAxis: {
    style: {
      axis: { stroke: '#D1D1D1' },
      grid: { stroke: '#EDEDED' },
      tickLabels: { fontFamily: global_FontFamily_sans_serif.value },
    },
  },
};

const tooltipTheme = {
  // General tooltip style
  tooltip: {
    flyoutStyle: {
      fill: '#151515',
    },
    style: {
      labels: {
        fontFamily: global_FontFamily_sans_serif.value,
        fill: '#FFF',
      },
    },
  },

  // Voronoi container tooltip theme, overrides general tooltip style
  voronoi: {
    style: {
      flyout: {
        fill: '#151515',
      },
      labels: {
        fontFamily: global_FontFamily_sans_serif.value,
        fill: '#FFF',
      },
    },
  },
};

const chartPadding = {
  chart: {
    padding: {
      bottom: 30,
      left: 60,
      right: 0,
      top: 0,
    },
  },
};

export const areaTheme = {
  area: {
    style: {
      data: {
        labels: global_FontFamily_sans_serif.value,
        fillOpacity: .15,
      },
    },
  },
  ...chartPadding,
  ...independentAxisTheme,
  ...dependentAxisTheme,
  ...tooltipTheme,
};
