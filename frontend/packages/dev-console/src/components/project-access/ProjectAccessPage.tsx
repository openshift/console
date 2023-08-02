import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { Firehose } from '@console/internal/components/utils';
import { useProjectAccessRoles } from './hooks';
import ProjectAccess from './ProjectAccess';

const ProjectAccessPage: React.FC = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const namespace = params.ns;
  const roles = useProjectAccessRoles();
  const showFullForm = location.pathname.includes('project-access');
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Project access')}</title>
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
