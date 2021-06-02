import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../../models';

type KSRoutesOverviewListItemProps = {
  ksroute: K8sResourceKind;
};

const KSRoutesOverviewListItem: React.FC<KSRoutesOverviewListItemProps> = ({ ksroute }) => {
  const { t } = useTranslation();
  const {
    metadata: { name, namespace },
    status,
  } = ksroute;
  return (
    status && (
      <li className="list-group-item">
        <div className="row">
          <div className="col-xs-10">
            <ResourceLink kind={referenceForModel(RouteModel)} name={name} namespace={namespace} />
            {status.url?.length > 0 && (
              <>
                <span className="text-muted">{t('knative-plugin~Location:')} </span>
                <ExternalLink
                  href={status.url}
                  additionalClassName="co-external-link--block"
                  text={status.url}
                />
              </>
            )}
          </div>
        </div>
      </li>
    )
  );
};

export default KSRoutesOverviewListItem;
