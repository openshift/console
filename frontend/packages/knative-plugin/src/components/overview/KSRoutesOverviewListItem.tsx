import * as React from 'react';
import { Grid, GridItem, ListItem } from '@patternfly/react-core';
import { ClipboardCopy } from '@patternfly/react-core/dist/dynamic/components/ClipboardCopy';
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
  const { metadata: { name, namespace } = { name: '', namespace: '' }, status } = ksroute;

  const isPrivateKSVC =
    ksroute?.metadata?.labels?.[PRIVATE_KNATIVE_SERVING_LABEL] === 'cluster-local';

  return (
    <ListItem>
      <Grid hasGutter>
        <GridItem>
          <ResourceLink kind={referenceForModel(RouteModel)} name={name} namespace={namespace} />
          {status?.url?.length > 0 && (
            <>
              <span className="pf-v6-u-text-color-subtle">{t('knative-plugin~Location:')} </span>
              {isPrivateKSVC ? (
                <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
                  {status?.url ?? ''}
                </ClipboardCopy>
              ) : (
                <ExternalLinkWithCopy
                  href={status?.url ?? ''}
                  text={status?.url ?? ''}
                  displayBlock
                />
              )}
            </>
          )}
        </GridItem>
      </Grid>
    </ListItem>
  );
};

export default KSRoutesOverviewListItem;
