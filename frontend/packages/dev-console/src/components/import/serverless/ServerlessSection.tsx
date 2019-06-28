import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { stateToProps } from '@console/internal/reducers/features';
import { FLAG_KNATIVE_SERVING } from '@console/knative-plugin/src/const';
import FormSection from '../section/FormSection';
import { CheckboxField } from '../../formik-fields';
import './ServerlessSection.scss';

type ServerlessSectionProps = {
  flags: { [key: string]: boolean };
};

const ServerlessSection: React.FC<ServerlessSectionProps> = ({ flags }) => {
  if (flags[FLAG_KNATIVE_SERVING]) {
    return (
      <FormSection title="Serverless Options" divider>
        <button
          title="Tech Preview"
          type="button"
          className="btn pf-c-button odc-serverless-tech-preview"
        >
          Tech Preview
        </button>
        <CheckboxField
          type="checkbox"
          label="Enable scaling to zero when idle"
          name="serverless.trigger"
        />
      </FormSection>
    );
  }

  return null;
};

export default connect(
  (state) => stateToProps([FLAG_KNATIVE_SERVING], state),
  null,
  null,
  { areStatePropsEqual: _.isEqual },
)(ServerlessSection);
