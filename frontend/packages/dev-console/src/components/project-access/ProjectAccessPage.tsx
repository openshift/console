import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useProjectAccessRoles } from './hooks';
import { RoleBinding } from './project-access-form-utils-types';
import ProjectAccess from './ProjectAccess';

const ProjectAccessPage: FC = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const namespace = params.ns;
  const roles = useProjectAccessRoles();
  const showFullForm = location.pathname.includes('project-access');

  const [roleBindingsData, loaded, loadError] = useK8sWatchResource<RoleBinding[]>({
    namespace,
    kind: 'RoleBinding',
    isList: true,
    optional: true,
  });

  const roleBindings = {
    data: roleBindingsData || [],
    loaded,
    loadError,
  };

  return (
    <>
      <DocumentTitle>{t('devconsole~Project access')}</DocumentTitle>
      <ProjectAccess
        fullFormView={showFullForm}
        namespace={namespace}
        roles={roles}
        roleBindings={roleBindings}
        {...props}
      />
    </>
  );
};

export default ProjectAccessPage;
