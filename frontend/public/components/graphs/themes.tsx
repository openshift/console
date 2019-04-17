/* eslint-disable camelcase */

import { global_FontFamily_sans_serif } from '@patternfly/react-tokens';

const independentAxisStyles = {
  independentAxis: {
    style: {
      axis: { stroke: '#D1D1D1' },
      tickLabels: { fontFamily: global_FontFamily_sans_serif.value },
    },
  },
};

const dependentAxisStyles = {
  dependentAxis: {
    style: {
      axis: { stroke: '#D1D1D1' },
      grid: { stroke: '#EDEDED' },
      tickLabels: { fontFamily: global_FontFamily_sans_serif.value },
    },
  },
};

const tooltipStyles = {
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

export const areaStyles = {
  area: {
    style: {
      data: {
        labels: global_FontFamily_sans_serif.value,
        fillOpacity: .15,
      },
    },
  },
};

export const cartesianChartStyles = {
  chart: {
    padding: {
      bottom: 30,
      left: 60,
      right: 0,
      top: 0,
    },
  },
  ...independentAxisStyles,
  ...dependentAxisStyles,
  ...tooltipStyles,
};
