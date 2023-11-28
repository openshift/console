import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SectionHeading, units } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';

type NodeDetailsImagesProps = {
  node: NodeKind;
};

const NodeDetailsImages: React.FC<NodeDetailsImagesProps> = ({ node }) => {
  const images = _.filter(node.status.images, 'names');
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('console-app~Images')} />
      <div className="co-table-container">
        <table className="pf-v5-c-table pf-m-compact pf-m-border-rows">
          <thead className="pf-v5-c-table__thead">
            <tr className="pf-v5-c-table__tr">
              <th className="pf-v5-c-table__th">{t('console-app~Name')}</th>
              <th className="pf-v5-c-table__th">{t('console-app~Size')}</th>
            </tr>
          </thead>
          <tbody className="pf-v5-c-table__tbody">
            {_.map(images, (image, i) => (
              <tr className="pf-v5-c-table__tr" key={i}>
                <td className="pf-v5-c-table__td pf-m-break-word co-select-to-copy">
                  {image.names.find(
                    (name: string) => !name.includes('@') && !name.includes('<none>'),
                  ) || image.names[0]}
                </td>
                <td className="pf-v5-c-table__td">
                  {units.humanize(image.sizeBytes, 'binaryBytes', true).string || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NodeDetailsImages;
