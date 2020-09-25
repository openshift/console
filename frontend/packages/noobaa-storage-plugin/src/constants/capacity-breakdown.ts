export enum ServiceType {
  MCG = 'Multi Cloud Gateway',
  RGW = 'RADOS Gateway',
  ALL = 'All',
}

export namespace CapacityBreakdown {
  export enum Metrics {
    TOTAL = 'Total',
    PROJECTS = 'Projects',
    BC = 'Bucket Classses',
    OBC = 'Object Bucket Claims',
  }

  export const defaultMetrics = Object.freeze({
    [ServiceType.MCG]: Metrics.PROJECTS,
    [ServiceType.RGW]: Metrics.TOTAL,
    [ServiceType.ALL]: Metrics.TOTAL,
  });

  export const serviceMetricMap = Object.freeze({
    [ServiceType.ALL]: {
      [CapacityBreakdown.Metrics.TOTAL]: ['RADOS Gateway', 'Multi Cloud Gateway'],
    },
    [ServiceType.RGW]: {
      [CapacityBreakdown.Metrics.TOTAL]: ['RADOS Gateway'],
    },
    [ServiceType.MCG]: {
      [CapacityBreakdown.Metrics.TOTAL]: ['Multi Cloud Gateway'],
    },
  });
}
