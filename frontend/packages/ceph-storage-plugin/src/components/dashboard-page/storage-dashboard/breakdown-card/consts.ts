export enum Colors {
  AVAILABLE = '#b8bbbe',
  OTHER = '#000',
  LINK = '#0066cc',
}

export const COLORMAP = [
  'rgb(236, 122, 8)',
  'rgb(139, 193, 247)',
  'rgb(76, 177, 64)',
  'rgb(160, 158, 220)',
  'rgb(0, 149, 150)',
];

export const OTHER = 'Other';
export const CLUSTERWIDE = 'Cluster-wide';
export const BUCKETCLASSKIND = 'BucketClass';

export const OTHER_TOOLTIP = 'All other capacity usage that are not a part of the top 5 consumers.';
export const CLUSTERWIDE_TOOLTIP =
  'Any NON Object bucket claims that were created via an S3 client or via the NooBaa UI system.';
