import * as React from 'react';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router';

const WelcomePage = ({ history }) => {
  localStorage.setItem('flag/first-time-login', true);
  return (
    <>
      <Helmet>
        <title>Audit</title>
      </Helmet>
      <div className="welcome__wrapper">
        <p className="welcome__title">HyperCloud에 오신 것을 환영합니다!</p>
        <p className="welcome__description">HyperCloud는 애플리케이션을 빠르게 개발, 호스팅 및 확장하는 데 도움을 줍니다.</p>
        <p className="welcome__description">시작하기 위해 애플리케이션 용 네임스페이스를 만드세요.</p>
        <p className="welcome__description">
          자세한 내용은{' '}
          <a href="https://technet.tmaxsoft.com/upload/download/online/hypercloud/pver-20200918-000001/4.1-ko/welcome/overview_sub/index.html" target="_blank">
            HyperCloud 매뉴얼<i className="fas fa-external-link-alt"></i>
          </a>
          을 참조하세요.
        </p>
        <button
          className="welcome__button"
          onClick={() => {
            history.push('/k8s/cluster/namespaces');
          }}
        >
          HyperCloud 시작하기
        </button>
      </div>
    </>
  );
};

export default withRouter(WelcomePage);
