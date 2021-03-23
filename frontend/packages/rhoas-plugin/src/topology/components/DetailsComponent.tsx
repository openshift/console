import * as React from 'react';
import { ResourceSummary } from '@console/internal/components/utils';
import { useTranslation } from 'react-i18next';
import { KafkaConnection } from '../../utils/rhoas-types';

export const DetailsComponent: React.FC<{ obj: KafkaConnection }> = ({ obj }) => {
  const { t } = useTranslation();
  const boostrapServerHost = obj.status?.bootstrapServerHost;
  const url = obj.status?.metadata?.cloudUI;

  return (
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={obj} />
        </div>
        {boostrapServerHost && (
          <dl className="co-m-pane__details">
            <dt>{t('rhoas-plugin~Bootstrap Server')}</dt>
            <dd>{boostrapServerHost}</dd>
          </dl>
        )}
        {url && (
          <dl className="co-m-pane__details">
            <dt>{t('rhoas-plugin~URL')}</dt>
            <dd>
              <a href={url} rel="noopener noreferrer" target="_blank">
                {url}
              </a>
            </dd>
          </dl>
        )}
      </div>
    </div>
  );
};
