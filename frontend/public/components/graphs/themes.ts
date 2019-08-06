export const areaTheme = {
  area: {
    style: {
      data: {
        fillOpacity: .15,
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
      grid: {stroke: '#EDEDED'},
    },
  },
};

export const barTheme = {
  bar: {
    style: {
      labels: {
        textAnchor: 'end',
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
        textAnchor: 'start',
      },
    },
  },
};

export const queryBrowserTheme = {
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
      tickLabels: {
        padding: 0,
      },
    },
  },
  independentAxis: {
    style: {
      tickLabels: {
        padding: 2,
      },
      ticks: {
        size: 5,
        strokeWidth: 1,
        stroke: '#d2d2d2',
      },
    },
  },
};
