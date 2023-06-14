import * as React from 'react';
import * as classNames from 'classnames';
import { FormikProps, FormikValues } from 'formik/dist/types';
import { useTranslation } from 'react-i18next';
import { HTTPMessageTypes, ResponsePaneTab } from '../types';
import ResponseBody from './ResponseBody';
import ResponseInfo from './ResponseInfo';

const ResponsePane: React.FC<FormikProps<FormikValues>> = (props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<ResponsePaneTab>(ResponsePaneTab.Body);
  return (
    <>
      <div className="co-m-horizontal-nav">
        <ul className="co-m-horizontal-nav__menu">
          <li className="co-m-horizontal-nav__menu-item co-m-horizontal-nav-item--active">
            <button type="button">{t(`knative-plugin~${HTTPMessageTypes.Response}`)}</button>
          </li>
        </ul>
      </div>
      <br />
      <div className="co-m-horizontal-nav">
        <ul className="co-m-horizontal-nav__menu">
          <li
            className={classNames(
              { 'co-m-horizontal-nav-item--active': activeTab === ResponsePaneTab.Body },
              'co-m-horizontal-nav__menu-item',
            )}
          >
            <button type="button" onClick={() => setActiveTab(ResponsePaneTab.Body)}>
              {t(`knative-plugin~${ResponsePaneTab.Body}`)}
            </button>
          </li>
          <li
            className={classNames(
              { 'co-m-horizontal-nav-item--active': activeTab === ResponsePaneTab.Info },
              'co-m-horizontal-nav__menu-item',
            )}
          >
            <button type="button" onClick={() => setActiveTab(ResponsePaneTab.Info)}>
              {t(`knative-plugin~${ResponsePaneTab.Info}`)}
            </button>
          </li>
        </ul>
      </div>
      <br />
      {activeTab === ResponsePaneTab.Body ? (
        <ResponseBody {...props} />
      ) : (
        <ResponseInfo {...props} />
      )}
    </>
  );
};

export default ResponsePane;
