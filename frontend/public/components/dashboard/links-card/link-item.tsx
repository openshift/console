import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ExternalLink } from '@console/internal/components/utils';

export const LinkItem: React.FC<LinkItemProps> = ({ link }) => (
  <li><ExternalLink href={link.spec.href} text={link.spec.text} /></li>
);

type LinkItemProps = {
  link: K8sResourceKind;
};
