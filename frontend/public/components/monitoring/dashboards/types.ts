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
};
