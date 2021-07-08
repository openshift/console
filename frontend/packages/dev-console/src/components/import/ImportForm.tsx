import * as React from 'react';
import { Formik, FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { history, AsyncComponent } from '@console/internal/components/utils';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import {
  ALL_APPLICATIONS_KEY,
  useActivePerspective,
  usePostFormSubmitAction,
} from '@console/shared';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { getBaseInitialValues } from './form-initial-values';
import { createOrUpdateResources, handleRedirect } from './import-submit-utils';
import {
  GitImportFormData,
  FirehoseList,
  ImportData,
  Resources,
  BaseFormData,
} from './import-types';
import { validationSchema } from './import-validation-utils';
import { useUpdateKnScalingDefaultValues } from './serverless/useUpdateKnScalingDefaultValues';

export interface ImportFormProps {
  namespace: string;
  importData: ImportData;
  contextualSource?: string;
  imageStreams?: FirehoseList;
  projects?: {
    loaded: boolean;
    data: [];
  };
}

export interface StateProps {
  activeApplication: string;
}

const ImportForm: React.FC<ImportFormProps & StateProps> = ({
  namespace,
  imageStreams,
  importData,
  contextualSource,
  activeApplication,
  projects,
}) => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const postFormCallback = usePostFormSubmitAction();

  const initialBaseValues: BaseFormData = getBaseInitialValues(namespace, activeApplication);
  const initialValues: GitImportFormData = {
    ...initialBaseValues,
    application: {
      ...initialBaseValues.application,
      selectedKey:
        activeApplication === t('devconsole~no application group')
          ? UNASSIGNED_KEY
          : activeApplication,
      isInContext: !!sanitizeApplicationValue(activeApplication),
    },
    resourceTypesNotValid: contextualSource ? [Resources.KnativeService] : [],
    pipeline: {
      enabled: false,
    },
    git: {
      url: '',
      type: '',
      ref: '',
      dir: '/',
      showGitType: false,
      secret: '',
      isUrlValidating: false,
    },
    docker: {
      dockerfilePath: 'Dockerfile',
    },
    build: {
      ...initialBaseValues.build,
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
      strategy: importData.buildStrategy || 'Source',
    },
  };

  const initialVals = useUpdateKnScalingDefaultValues(initialValues);
  const builderImages: NormalizedBuilderImages =
    imageStreams && imageStreams.loaded && normalizeBuilderImages(imageStreams.data);

  const handleSubmit = (values, actions) => {
    const imageStream = builderImages && builderImages[values.image.selected].obj;
    const createNewProject = projects.loaded && _.isEmpty(projects.data);
    const {
      project: { name: projectName },
    } = values;

    const resourceActions = createOrUpdateResources(
      t,
      values,
      imageStream,
      createNewProject,
      true,
    ).then(() => createOrUpdateResources(t, values, imageStream));

    resourceActions
      .then((resources) => {
        postFormCallback(resources);
      })
      .catch(() => {});

    return resourceActions
      .then(() => {
        handleRedirect(projectName, perspective, perspectiveExtensions);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const renderForm = (formikProps: FormikProps<any>) => {
    return (
      <AsyncComponent
        {...formikProps}
        projects={projects}
        builderImages={builderImages}
        loader={importData.loader}
      />
    );
  };

  return (
    <Formik
      initialValues={initialVals}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={validationSchema(t)}
    >
      {renderForm}
    </Formik>
  );
};

type OwnProps = ImportFormProps & { forApplication?: string };
const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const activeApplication = ownProps.forApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
  };
};

export default connect(mapStateToProps)(ImportForm);
