import * as React from 'react';
import * as _ from 'lodash';
import { Formik } from 'formik';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import { Button, ButtonVariant } from '@patternfly/react-core';
import ProbeForm from './ProbeForm';
import { HealthCheckProbeDataType } from './health-checks-types';
import { getHealthChecksProbe } from './health-check-probe-utils';
import { getValidationSchema } from './health-check-probe-validation-utils';
import './HealthCheckProbe.scss';

interface HealthCheckProbeProps {
  probe: string;
  initialValues: HealthCheckProbeDataType;
}

const HealthCheckProbe: React.FC<HealthCheckProbeProps> = ({ probe, initialValues }) => {
  const [addProbe, setAddProbe] = React.useState(false);
  const [selectedProbe, setSelectedProbe] = React.useState<React.ReactNode>('');
  const [probeData, setProbeData] = React.useState<HealthCheckProbeDataType>();

  const onEditProbe = () => {
    setAddProbe(true);
  };

  const handleDeleteProbe = () => {
    setAddProbe(false);
    setSelectedProbe('');
    setProbeData(initialValues);
  };

  const handleReset = (values, actions) => {
    actions.resetForm({ values: initialValues, status: {} });
    setAddProbe(false);
  };

  const handleSubmit = (values, actions) => {
    actions.setSubmitting(true);
    setAddProbe(false);
    setProbeData(values);
    setSelectedProbe(
      <>
        {`${getHealthChecksProbe(probe).formTitle} Added`}
        <Button
          className="pf-m-plain--align-left"
          variant={ButtonVariant.plain}
          onClick={handleDeleteProbe}
        >
          <MinusCircleIcon />
        </Button>
      </>,
    );
  };

  const handleAddProbe = () => {
    setAddProbe(true);
  };

  const renderProbe = () => {
    if (addProbe) {
      return (
        <Formik
          initialValues={!_.isEmpty(probeData) ? probeData : initialValues}
          onSubmit={handleSubmit}
          onReset={handleReset}
          validationSchema={getValidationSchema}
        >
          {(props) => <ProbeForm {...props} />}
        </Formik>
      );
    }
    if (selectedProbe) {
      return selectedProbe;
    }
    return (
      <Button
        className="pf-m-link--align-left"
        variant={ButtonVariant.link}
        onClick={handleAddProbe}
        icon={<PlusCircleIcon />}
      >
        {`Add ${getHealthChecksProbe(probe).formTitle}`}
      </Button>
    );
  };

  return (
    <>
      <div className="co-section-heading-tertiary odc-heath-check-probe__formTitle">
        {getHealthChecksProbe(probe).formTitle}
        {!_.isEmpty(selectedProbe) && (
          <Button
            className="pf-m-link--align-left"
            variant={ButtonVariant.link}
            onClick={onEditProbe}
          >
            &nbsp;&nbsp;
            {'Edit Probe'}
          </Button>
        )}
      </div>
      <div className="pf-c-form__helper-text">{getHealthChecksProbe(probe).formSubtitle}</div>
      <div className="co-toolbar__group co-toolbar__group--left">{renderProbe()}</div>
    </>
  );
};

export default HealthCheckProbe;
