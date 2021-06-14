import * as React from 'react';
import { Button, Grid, Split, SplitItem } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ExternalLink, resourcePath } from '@console/internal/components/utils';
import { K8sResourceKindReference } from '@console/internal/module/k8s';

import './labels-list.scss';

export const LabelsList = ({
  kind = '',
  isEmpty,
  onLabelAdd,
  children,
  addRowText = null,
  emptyStateAddRowText = null,
}: LabelsListProps) => {
  const { t } = useTranslation();
  const addRowTxt = addRowText || t('kubevirt-plugin~Add Label');
  const emptyStateAddRowTxt =
    emptyStateAddRowText || t('kubevirt-plugin~Add Label to specify qualifying nodes');
  return (
    <>
      <Grid className="kv-labels-list__grid">{children}</Grid>
      <Split className="kv-labels-list__buttons">
        <SplitItem>
          <Button
            className="pf-m-link--align-left"
            id="vm-labels-list-add-btn"
            variant="link"
            onClick={() => onLabelAdd()}
            icon={<PlusCircleIcon />}
          >
            {isEmpty ? emptyStateAddRowTxt : addRowTxt}
          </Button>
        </SplitItem>
        <SplitItem isFilled />
        <SplitItem>
          {kind && (
            <ExternalLink
              additionalClassName="kv-labels-list__link"
              text={<div>{t('kubevirt-plugin~Explore {{kind}} list', { kind })}</div>}
              href={resourcePath(kind)}
            />
          )}
        </SplitItem>
      </Split>
    </>
  );
};

type LabelsListProps = {
  children: React.ReactNode;
  isEmpty: boolean;
  kind?: K8sResourceKindReference;
  addRowText?: string;
  emptyStateAddRowText?: string;
  onLabelAdd: () => void;
};
