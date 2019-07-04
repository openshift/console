import * as React from 'react';
import * as _ from 'lodash';

import { getResource } from 'kubevirt-web-ui-components';

import {
  Firehose,
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
} from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';

import { connect } from 'react-redux';
import { VMTemplateResourceSummary, VMTemplateDetailsList } from './vm-template-resource';
import { DataVolumeModel } from '../../models';

const VMTemplateDetailsFirehose: React.FC<VMTemplateDetailsFirehoseProps> = (props) => {
  const { obj: template, hasDataVolumes } = props;
  const { namespace } = template.metadata;

  const resources = [
    getResource(DataVolumeModel, { namespace, optional: true, prop: 'datavolumes' }),
  ];

  return (
    <div className="co-m-pane__body">
      {hasDataVolumes ? (
        <Firehose resources={resources}>
          <VMTemplateDetails template={template} />
        </Firehose>
      ) : (
        <VMTemplateDetails template={template} hasDataVolumes={hasDataVolumes} />
      )}
    </div>
  );
};

const stateToProps = ({ k8s }) => {
  return {
    hasDataVolumes: !!k8s.getIn(['RESOURCES', 'models', DataVolumeModel.kind]),
  };
};

export const VMTemplateDetailsConnected = connect(stateToProps)(VMTemplateDetailsFirehose);

const VMTemplateDetails: React.FC<VMTemplateDetailsProps> = (props) => {
  const { template, ...restProps } = props;
  const flatResources = {
    template,
    dataVolumes: _.get(props, 'datavolumes.data'),
  };
  const loaded = props.loaded || !props.hasDataVolumes;

  return (
    <StatusBox data={template} {...restProps} loaded={loaded}>
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
  loaded?: boolean;
  hasDataVolumes?: boolean;
};

type VMTemplateDetailsFirehoseProps = {
  obj: TemplateKind;
  hasDataVolumes: boolean;
};
