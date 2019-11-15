import * as React from 'react';
import {
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
  useAccessReview,
  asAccessReview,
} from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VMTemplateResourceSummary, VMTemplateDetailsList } from './vm-template-resource';

export const VMTemplateDetails: React.FC<VMTemplateDetailsProps> = ({ obj: template }) => {
  const canUpdate = useAccessReview(asAccessReview(TemplateModel, template, 'patch'));

  return (
    <StatusBox data={template} loaded={!!template}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text="VM Template Overview" />
        <div className="row">
          <div className="col-sm-6">
            <VMTemplateResourceSummary template={template} canUpdateTemplate={canUpdate} />
          </div>
          <div className="col-sm-6">
            <VMTemplateDetailsList template={template} canUpdateTemplate={canUpdate} />
          </div>
        </div>
      </div>
    </StatusBox>
  );
};

type VMTemplateDetailsProps = {
  obj: TemplateKind;
};
