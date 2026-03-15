import type { ComponentType } from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { PageComponentProps } from '@console/internal/components/utils';
import { SectionHeading } from '@console/internal/components/utils';
import type { NodeKind } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import LocalDisks from './LocalDisks';
import PersistentVolumes from './PersistentVolumes';

const NodeStorage: ComponentType<PageComponentProps<NodeKind>> = ({ obj: node }) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('console-app~Node storage')} />
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXl' }}>
        <FlexItem>
          <LocalDisks node={node} />
        </FlexItem>
        <FlexItem>
          <PersistentVolumes node={node} />
        </FlexItem>
      </Flex>
    </PaneBody>
  );
};

export default NodeStorage;
