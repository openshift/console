export type Panel = {
  decimals?: number;
  format?: string;
  gridPos?: {
    h: number;
    w: number;
    x: number;
    y: number;
  };
  id: string;
  panels: Panel[];
  postfix?: string;
  prefix?: string;
  span: number;
  stack: boolean;
  targets: {
    expr: string;
  };
  title: string;
  type: string;
  units?: string;
};
