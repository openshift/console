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
      right: 0,
      top: 0,
    },
  },
  dependentAxis: {
    style: {
      grid: {stroke: '#ededed'},
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
};

export const queryBrowserTheme = {
  ...areaTheme,
  independentAxis: {
    style: {
      grid: {stroke: '#ededed'},
    },
  },
};
