import type { FC } from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { ContainerSpec } from '../../module/k8s';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

const ContainerRow: FC<ContainerRowProps> = ({ container }) => {
  const resourceLimits = _.get(container, 'resources.limits');
  const ports = _.get(container, 'ports');
  return (
    <Tr>
      <Td>{container.name}</Td>
      <Td className="co-select-to-copy" modifier="breakWord">
        {container.image || '-'}
      </Td>
      <Td visibility={['hidden', 'visibleOnSm']}>
        {_.map(resourceLimits, (v, k) => `${k}: ${v}`).join(', ') || '-'}
      </Td>
      <Td visibility={['hidden', 'visibleOnMd']}>
        {_.map(ports, (port) => `${port.containerPort}/${port.protocol}`).join(', ') || '-'}
      </Td>
    </Tr>
  );
};

export const ContainerTable: FC<ContainerTableProps> = ({ containers }) => {
  const { t } = useTranslation();
  return (
    <Table gridBreakPoint="">
      <Thead>
        <Tr>
          <Th>{t('public~Name')}</Th>
          <Th>{t('public~Image')}</Th>
          <Th visibility={['hidden', 'visibleOnSm']}>{t('public~Resource limits')}</Th>
          <Th visibility={['hidden', 'visibleOnMd']}>{t('public~Ports')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {_.map(containers, (c, i) => (
          <ContainerRow key={i} container={c} />
        ))}
      </Tbody>
    </Table>
  );
};

export type ContainerRowProps = {
  container: ContainerSpec;
};

export type ContainerTableProps = {
  containers: ContainerSpec[];
};
