import * as React from 'react';
import { ClipboardCopy } from '@patternfly/react-core/dist/esm/components/ClipboardCopy';
import { useTranslation } from 'react-i18next';
import { ResourceLink, ExternalLinkWithCopy } from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { PRIVATE_KNATIVE_SERVING_LABEL } from '../../const';
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

  const isPrivateKSVC =
    ksroute?.metadata?.labels?.[PRIVATE_KNATIVE_SERVING_LABEL] === 'cluster-local';

  return (
    <li className="list-group-item">
      <div className="row">
        <div className="col-xs-12">
          <ResourceLink kind={referenceForModel(RouteModel)} name={name} namespace={namespace} />
          {status?.url?.length > 0 && (
            <>
              <span className="text-muted">{t('knative-plugin~Location:')} </span>
              {isPrivateKSVC ? (
                <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
                  {status.url}
                </ClipboardCopy>
              ) : (
                <ExternalLinkWithCopy
                  link={status.url}
                  text={status.url}
                  additionalClassName="co-external-link--block"
                />
              )}
            </>
          )}
        </div>
      </div>
    </li>
  );
};

export default KSRoutesOverviewListItem;
