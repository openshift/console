import type { FC } from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from '@console/internal/components/utils/headings';
import { humanizeBinaryBytes } from '@console/internal/components/utils/units';
import type { NodeKind } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

type NodeDetailsImagesProps = {
  node: NodeKind;
};

const NodeDetailsImages: FC<NodeDetailsImagesProps> = ({ node }) => {
  const images = _.filter(node.status.images, 'names');
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('console-app~Images')} />
      <div className="co-table-container">
        <Table variant="compact" gridBreakPoint="">
          <Thead>
            <Tr>
              <Th>{t('console-app~Name')}</Th>
              <Th>{t('console-app~Size')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {_.map(images, (image, i) => (
              <Tr key={i}>
                <Td
                  dataLabel={t('console-app~Name')}
                  modifier="breakWord"
                  className="co-select-to-copy"
                >
                  {image.names.find(
                    (name: string) => !name.includes('@') && !name.includes('<none>'),
                  ) || image.names[0]}
                </Td>
                <Td dataLabel={t('console-app~Size')}>
                  {humanizeBinaryBytes(image.sizeBytes).string || '-'}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </PaneBody>
  );
};

export default NodeDetailsImages;
