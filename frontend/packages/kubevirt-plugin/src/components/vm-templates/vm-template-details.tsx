import * as React from 'react';
import { connect } from 'react-redux';
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
import { getResource } from '../../utils';
import { VMTemplateResourceSummary, VMTemplateDetailsList } from './vm-template-resource';

const VMTemplateDetailsFirehose: React.FC<VMTemplateDetailsFirehoseProps> = (props) => {
  const { obj: template, hasDataVolumes } = props;
  const namespace = getNamespace(template);

  const resources = [
    getResource(DataVolumeModel, { namespace, optional: true, prop: 'datavolumes' }),
  ];

  const otherProps = { template };

  return (
    <div className="co-m-pane__body">
      {hasDataVolumes ? (
        <Firehose resources={resources}>
          <VMTemplateDetails {...otherProps} />
        </Firehose>
      ) : (
        <VMTemplateDetails {...otherProps} hasDataVolumes={hasDataVolumes} />
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
  const loaded = props.loaded || !props.hasDataVolumes;

  const canUpdate = useAccessReview(asAccessReview(TemplateModel, template, 'patch'));

  return (
    <StatusBox data={template} {...restProps} loaded={loaded}>
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
  template: TemplateKind;
  loaded?: boolean;
  hasDataVolumes?: boolean;
};

type VMTemplateDetailsFirehoseProps = {
  obj: TemplateKind;
  hasDataVolumes: boolean;
};
