import * as _ from 'lodash';
import { connect } from 'react-redux';
import { AlertVariant } from '@patternfly/react-core';
import { iGet, toShallowJS } from '../../../utils/immutable';
import { Error, Errors } from '../../errors/errors';
import { CommonDataProp, VMWizardProps } from '../types';
import { iGetCommonData } from '../selectors/immutable/selectors';
import { getLoadError, getModelString } from '../../../utils';
import { K8sKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { getExtraWSQueries } from '../selectors/selectors';

const asError = ({
  state,
  model,
  wizardReduxID,
  key,
  variant,
  name,
  namespace,
  isList,
}: {
  state: any;
  wizardReduxID: string;
  key: CommonDataProp;
  model: K8sKind | any;
  variant?: AlertVariant;
  isList?: boolean;
  name?: string;
  namespace?: string;
}): Error => {
  const firehoseResult = iGetCommonData(state, wizardReduxID, key);
  return (
    (iGet(firehoseResult, 'loadError') || !firehoseResult) && {
      message: getLoadError(toShallowJS(firehoseResult), model, isList),
      title: `Could not load ${getModelString(model, isList)}${name ? ` ${name}` : ''}${
        namespace ? ` in ${namespace} namespace` : ''
      }`,
      key: key as string,
      variant: variant || AlertVariant.danger,
    }
  );
};

const stateToProps = (state, { wizardReduxID }) => {
  const errors = [];

  if (iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftFlag)) {
    errors.push(
      asError({
        state,
        wizardReduxID,
        key: VMWizardProps.commonTemplates,
        isList: true,
        model: TemplateModel,
      }),
      asError({
        state,
        wizardReduxID,
        key: VMWizardProps.userTemplates,
        isList: true,
        model: TemplateModel,
      }),
    );
  }

  errors.push(
    asError({
      state,
      wizardReduxID,
      key: VMWizardProps.dataVolumes,
      isList: true,
      model: DataVolumeModel,
    }),
    asError({
      state,
      wizardReduxID,
      key: VMWizardProps.virtualMachines,
      isList: true,
      model: VirtualMachineModel,
      variant: AlertVariant.warning,
    }), // for validation only
    ...getExtraWSQueries(state, wizardReduxID).map((query) =>
      asError({
        state,
        wizardReduxID,
        key: query.prop as CommonDataProp,
        isList: query.isList,
        model: query.kind,
        name: query.name,
        namespace: query.namespace,
        variant: query.optional ? AlertVariant.warning : AlertVariant.danger,
      }),
    ),
  );

  return {
    endMargin: true,
    errors: errors.filter((err) => err && err.message),
  };
};

export const ResourceLoadErrors = connect(stateToProps, null, null, {
  areStatePropsEqual: _.isEqual,
})(Errors);
