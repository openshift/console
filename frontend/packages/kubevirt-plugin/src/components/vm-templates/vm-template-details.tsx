import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { getResource } from 'kubevirt-web-ui-components';
import { getNamespace } from '@console/shared';
import {
  Firehose,
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
  useAccessReview,
  asAccessReview,
} from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { DataVolumeModel } from '../../models';
import { VMTemplateResourceSummary, VMTemplateDetailsList } from './vm-template-resource';

const VMTemplateDetailsFirehose: React.FC<VMTemplateDetailsFirehoseProps> = (props) => {
  const { obj: template, hasDataVolumes } = props;
  const namespace = getNamespace(template);

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

  const canUpdate = useAccessReview(asAccessReview(TemplateModel, template, 'patch'));

  return (
    <StatusBox data={template} {...restProps} loaded={loaded}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text="VM Template Overview" />
        <div className="row">
          <div className="col-sm-6">
            <VMTemplateResourceSummary {...flatResources} canUpdateTemplate={canUpdate} />
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
