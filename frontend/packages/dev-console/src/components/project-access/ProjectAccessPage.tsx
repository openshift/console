import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { Firehose } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { labelForNodeKind, labelKeyForNodeKind } from '@console/shared';
import { useProjectAccessRoles } from './hooks';
import ProjectAccess from './ProjectAccess';

export interface ProjectAccessPageProps {
  match: RMatch<{ ns?: string }>;
  obj?: K8sResourceKind;
}

const ProjectAccessPage: React.FC<ProjectAccessPageProps> = ({ match, obj, ...props }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const roles = useProjectAccessRoles();
  const showFullForm = match.path.includes('project-access');
  return (
    <>
      <Helmet>
        <title data-title-id={`${labelForNodeKind(obj.kind)} · Project access`}>
          {obj.metadata.name}
          {' · '} {t(labelKeyForNodeKind(obj.kind))}
          {' · '} {t('devconsole~Project access')}
        </title>
      </Helmet>
      <Firehose
        resources={[
          {
            namespace,
            kind: 'RoleBinding',
            prop: 'roleBindings',
            isList: true,
            optional: true,
          },
        ]}
      >
        <ProjectAccess fullFormView={showFullForm} namespace={namespace} roles={roles} {...props} />
      </Firehose>
    </>
  );
};

export default ProjectAccessPage;
