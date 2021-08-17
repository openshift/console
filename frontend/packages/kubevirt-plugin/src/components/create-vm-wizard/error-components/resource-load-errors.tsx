import { AlertVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { K8sKind } from '@console/internal/module/k8s';
import { TemplateModel } from '../../../console-internal/models';
import { VirtualMachineModel } from '../../../models';
import { getKubevirtAvailableModel } from '../../../models/kubevirtReferenceForModel';
import { getLoadError, getModelString } from '../../../utils';
import { iGet, toShallowJS } from '../../../utils/immutable';
import { Error, Errors } from '../../errors/errors';
import { iGetCommonData } from '../selectors/immutable/selectors';
import { getExtraWSQueries } from '../selectors/selectors';
import { CommonDataProp, VMWizardProps } from '../types';

const asError = ({
  state,
  model,
  wizardReduxID,
  key,
  variant,
  name,
  namespace,
  isList,
  ignore404,
}: {
  state: any;
  wizardReduxID: string;
  key: CommonDataProp;
  model: K8sKind | any;
  variant?: AlertVariant;
  isList?: boolean;
  name?: string;
  namespace?: string;
  ignore404?: boolean;
}): Error => {
  const firehoseResult = iGetCommonData(state, wizardReduxID, key);
  const loadError = iGet(firehoseResult, 'loadError');

  if (firehoseResult && (!loadError || (ignore404 && loadError?.response?.status === 404))) {
    return null;
  }
  return {
    message: getLoadError(toShallowJS(firehoseResult), model, isList),
    title: `Could not load ${getModelString(model, isList)}${name ? ` ${name}` : ''}${
      namespace ? ` in ${namespace} namespace` : ''
    }`,
    key: key as string,
    variant: variant || AlertVariant.danger,
  };
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
    );

    if (iGetCommonData(state, wizardReduxID, VMWizardProps.userTemplate)) {
      errors.push(
        asError({
          state,
          wizardReduxID,
          key: VMWizardProps.userTemplate,
          isList: false,
          model: TemplateModel,
        }),
      );
    }
  }

  if (!getKubevirtAvailableModel(VirtualMachineModel)) {
    errors.push({
      message: 'No model registered for VirtualMachines',
      title: 'Could not load VirtualMachines',
      key: wizardReduxID,
      variant: AlertVariant.warning,
    });
  }

  errors.push(
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
        ignore404: query.errorBehaviour?.ignore404,
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
