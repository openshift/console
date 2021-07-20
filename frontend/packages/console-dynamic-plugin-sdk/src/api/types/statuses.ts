export type StatusComponentProps = {
  title?: string;
  iconOnly?: boolean;
  noTooltip?: boolean;
  className?: string;
  popoverTitle?: string;
};

export type StatusProps = StatusComponentProps & {
  status: string;
};

export type StatusIconAndTextProps = StatusComponentProps & {
  icon?: React.ReactElement;
  spin?: boolean;
};

export type GenericStatusProps = StatusComponentProps & {
  Icon: React.ComponentType<{ title?: string }>;
  popoverTitle?: string;
  noTooltip?: boolean;
};

export type ColoredIconProps = {
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};
