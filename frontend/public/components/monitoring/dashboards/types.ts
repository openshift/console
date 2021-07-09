export const MONITORING_DASHBOARDS_DEFAULT_TIMESPAN = 30 * 60 * 1000;

export const MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY = 'VARIABLE_ALL_OPTION_KEY';

export type ColumnStyle = {
  alias?: string;
  decimals?: number;
  unit?: string;
  pattern: string;
  type: string;
};

type ValueMap = {
  op: string;
  text: string;
  value: string;
};

type YAxis = {
  format: string;
};

export type Panel = {
  breakpoint?: string;
  decimals?: number;
  format?: string;
  gridPos?: {
    h: number;
    w: number;
    x: number;
    y: number;
  };
  id: string;
  legend?: {
    show: boolean;
  };
  options?: {
    fieldOptions: {
      thresholds: {
        color?: string;
        value: number;
      }[];
    };
  };
  panels: Panel[];
  postfix?: string;
  postfixFontSize?: string;
  prefix?: string;
  prefixFontSize?: string;
  span: number;
  stack: boolean;
  styles?: ColumnStyle[];
  targets: {
    expr: string;
    legendFormat?: string;
  };
  title: string;
  transform?: string;
  type: string;
  units?: string;
  valueFontSize?: string;
  valueMaps?: ValueMap[];
  yaxes: YAxis[];
};
