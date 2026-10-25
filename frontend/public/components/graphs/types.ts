// Types
export type DataPoint<X = Date | number | string> = {
  x?: X;
  y?: number;
  label?: string;
  metric?: { [key: string]: string };
  description?: string;
  symbol?: {
    type?: string;
    fill?: string;
  };
};

type PrometheusLabels = { [key: string]: string };
type PrometheusValue = [number, string];

// Only covers range and instant vector responses for now.
export type PrometheusResult = {
  metric: PrometheusLabels;
  values?: PrometheusValue[];
  value?: PrometheusValue;
};

type PrometheusData = {
  resultType: 'matrix' | 'vector' | 'scalar' | 'string';
  result: PrometheusResult[];
};

export type PrometheusResponse = {
  status: string;
  data: PrometheusData;
  errorType?: string;
  error?: string;
  warnings?: string[];
};
