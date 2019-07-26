import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import * as _ from 'lodash';
import { BuildConfigsPage } from '@console/internal/components/build-config';
import { withStartGuide } from '../../../../public/components/start-guide';
import DefaultPage from './DefaultPage';

export interface BuildConfigPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}
const allParams = (props) => Object.assign({}, _.get(props, 'match.params'), props);

const BuildConfigPage = withStartGuide((props: BuildConfigPageProps) => {
  const { noProjectsAvailable, ns } = allParams(props);
  return (
    <React.Fragment>
      <Helmet>
        <title>Builds</title>
      </Helmet>
      {ns ? (
        <BuildConfigsPage {...props} mock={noProjectsAvailable} />
      ) : (
        <DefaultPage title="Build Configs">
          Select a project to view the list of build configs
        </DefaultPage>
      )}
    </React.Fragment>
  );
});

export default BuildConfigPage;
