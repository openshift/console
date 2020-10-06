import * as React from 'react';
import * as helmIcon from '@console/internal/imgs/logos/helm.svg';

type HelmChartsIconProps = {
  className?: string;
  style?: React.CSSProperties;
};

const HelmChartsIcon: React.FC<HelmChartsIconProps> = ({ className, style }) => (
  <img className={className} style={style} src={helmIcon} alt="Helm Charts Logo" />
);

export default HelmChartsIcon;
