import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ExternalLink } from '@console/internal/components/utils';
import {
  OVIRT_DOCURL,
  V2VProviderErrorSpecialUIMessageRequest,
  VMWARE_DOCURL,
} from '../../../../../constants/v2v';
import { errorsFirstSort } from '../../../../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import { ResultsWrapper } from '../../../../../k8s/enhancedK8sMethods/types';
import { iGetIn, toShallowJS } from '../../../../../utils/immutable';
import { Errors } from '../../../../errors/errors';
import { iGetImportProviders } from '../../../selectors/immutable/import-providers';
import {
  ImportProvidersField,
  OvirtProviderField,
  VMImportProvider,
  VMWareProviderField,
} from '../../../types';
import { resultContentToString } from '../../../utils/utils';
import { ResultTabRow } from '../../result-tab/result-tab-row';

const getDocURL = (providerType: VMImportProvider) =>
  providerType === VMImportProvider.VMWARE ? VMWARE_DOCURL : OVIRT_DOCURL;

const resolveUIMessageTemplating = (t: TFunction, message: string, provider: VMImportProvider) => {
  if (!message) {
    return message;
  }

  const chunks = message.split(V2VProviderErrorSpecialUIMessageRequest.supplyDoclink);

  return (
    <>
      {...chunks.map((chunk, idx) => {
        const key = `${idx}`;
        if (idx === chunks.length - 1) {
          return <React.Fragment key={key}>{chunk}</React.Fragment>;
        }
        return (
          <React.Fragment key={key}>
            {chunk}
            <ExternalLink text={t('kubevirt-plugin~documentation')} href={getDocURL(provider)} />
          </React.Fragment>
        );
      })}
    </>
  );
};

const VmImportProviderControllerErrorsComponent: React.FC<VmImportProviderControllerErrorsComponentProps> = React.memo(
  ({ errors, provider }) => {
    const { t } = useTranslation();
    if (!errors) {
      return null;
    }
    const resultWrapper: ResultsWrapper = toShallowJS(errors);
    if (resultWrapper.isValid) {
      return null;
    }

    return (
      <div id={`v2v-${provider.toLowerCase()}-error`}>
        <Errors
          errors={[
            {
              title: resultWrapper.mainError?.title || t('kubevirt-plugin~Error'),
              message: resolveUIMessageTemplating(t, resultWrapper.mainError?.message, provider),
              detail: resolveUIMessageTemplating(t, resultWrapper.mainError?.detail, provider),
            },
            ...resultWrapper.errors,
          ].map((error) => ({
            ...error,
            variant: AlertVariant.danger,
          }))}
        />
        {errorsFirstSort(resultWrapper.requestResults).map(
          ({ content: { data, type }, ...rest }, index) => (
            <ResultTabRow
              key={`${index + 1}`}
              content={resultContentToString(data, type)}
              {...rest}
            />
          ),
        )}
      </div>
    );
  },
);

type VmImportProviderControllerErrorsComponentProps = {
  errors: any;
  provider: VMImportProvider;
};

const stateToProps = (state, { wizardReduxID, provider }) => ({
  errors: iGetIn(iGetImportProviders(state, wizardReduxID), [
    ImportProvidersField.PROVIDERS_DATA,
    provider,
    provider === VMImportProvider.OVIRT
      ? OvirtProviderField.CONTROLLER_LAST_ERROR
      : VMWareProviderField.CONTROLLER_LAST_ERROR,
    'errors',
  ]),
});

export const VMImportProviderControllerErrors = connect(stateToProps)(
  VmImportProviderControllerErrorsComponent,
);
