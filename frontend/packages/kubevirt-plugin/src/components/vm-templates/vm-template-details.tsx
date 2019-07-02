import * as React from 'react';

import { getResource } from 'kubevirt-web-ui-components';

import {
  Firehose,
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
} from '@console/internal/components/utils';

import { TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VMTemplateResourceSummary, VMTemplateDetailsList } from './vm-template-resource';

export const VMTemplateDetailsFirehose: React.FC<VMTemplateDetailsFirehoseProps> = ({
  obj: template,
}) => {
  const { name, namespace } = template.metadata;

  const vmtRes = getResource(TemplateModel, {
    name,
    namespace,
    isList: false,
    prop: 'vmt',
    optional: true,
  });

  const resources = [vmtRes];

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VMTemplateDetails template={template} />
      </Firehose>
    </div>
  );
};

const VMTemplateDetails: React.FC<VMTemplateDetailsProps> = (props) => {
  const { template, ...restProps } = props;
  const flatResources = {
    template,
  };

  return (
    <StatusBox data={template} {...restProps}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text="VM Template Overview" />
        <div className="row">
          <div className="col-sm-6">
            <VMTemplateResourceSummary {...flatResources} />
          </div>
          <div className="col-sm-6">
            <VMTemplateDetailsList {...flatResources} />
          </div>
        </div>
      </div>
    </StatusBox>
  );
};

type VMTemplateDetailsProps = {
  template: TemplateKind;
};

type VMTemplateDetailsFirehoseProps = {
  obj: TemplateKind;
};
