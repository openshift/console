import * as React from 'react';
import * as classNames from 'classnames';
import { FormikProps, FormikValues } from 'formik/dist/types';
import { useTranslation } from 'react-i18next';
import { HTTPMessageTypes, RequestPaneTab } from '../types';
import RequestBody from './RequestBody';
import RequestOptions from './RequestOptions';

const RequestPane: React.FC<FormikProps<FormikValues>> = (props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<RequestPaneTab>(RequestPaneTab.Body);
  return (
    <>
      <div className="co-m-horizontal-nav">
        <ul className="co-m-horizontal-nav__menu">
          <li className="co-m-horizontal-nav__menu-item co-m-horizontal-nav-item--active">
            <button type="button">{t(`knative-plugin~${HTTPMessageTypes.Request}`)}</button>
          </li>
        </ul>
      </div>
      <br />
      <div className="co-m-horizontal-nav">
        <ul className="co-m-horizontal-nav__menu">
          <li
            className={classNames(
              { 'co-m-horizontal-nav-item--active': activeTab === RequestPaneTab.Body },
              'co-m-horizontal-nav__menu-item',
            )}
          >
            <button type="button" onClick={() => setActiveTab(RequestPaneTab.Body)}>
              {t(`knative-plugin~${RequestPaneTab.Body}`)}
            </button>
          </li>
          <li
            className={classNames(
              { 'co-m-horizontal-nav-item--active': activeTab === RequestPaneTab.Options },
              'co-m-horizontal-nav__menu-item',
            )}
          >
            <button type="button" onClick={() => setActiveTab(RequestPaneTab.Options)}>
              {t(`knative-plugin~${RequestPaneTab.Options}`)}
            </button>
          </li>
        </ul>
      </div>
      <br />
      {activeTab === RequestPaneTab.Body ? (
        <RequestBody {...props} />
      ) : (
        <RequestOptions {...props} />
      )}
    </>
  );
};

export default RequestPane;
