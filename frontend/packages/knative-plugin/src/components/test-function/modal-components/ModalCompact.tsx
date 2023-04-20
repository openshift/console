import * as React from 'react';
import * as classNames from 'classnames';
import { FormikProps, FormikValues } from 'formik/dist/types';
import { useTranslation } from 'react-i18next';
import { HTTPMessageTypes, RequestPaneTab, ResponsePaneTab } from '../types';
import RequestBody from './RequestBody';
import RequestOptions from './RequestOptions';
import ResponseBody from './ResponseBody';
import ResponseInfo from './ResponseInfo';
import '../TestFunctionModal.scss';

const ModalCompact: React.FC<FormikProps<FormikValues>> = (props) => {
  const { t } = useTranslation();
  const [activeParentTab, setActiveParentTab] = React.useState<HTTPMessageTypes>(
    HTTPMessageTypes.Request,
  );
  const [activeTab, setActiveTab] = React.useState<RequestPaneTab | ResponsePaneTab>(
    RequestPaneTab.Body,
  );
  return (
    <>
      <div className="co-m-horizontal-nav">
        <ul className="co-m-horizontal-nav__menu">
          <li
            className={classNames(
              { 'co-m-horizontal-nav-item--active': activeParentTab === HTTPMessageTypes.Request },
              'co-m-horizontal-nav__menu-item',
            )}
          >
            <button
              type="button"
              onClick={() => {
                setActiveParentTab(HTTPMessageTypes.Request);
                setActiveTab(RequestPaneTab.Body);
              }}
            >
              {t(`knative-plugin~Request`)}
            </button>
          </li>
          <li
            className={classNames(
              { 'co-m-horizontal-nav-item--active': activeParentTab === HTTPMessageTypes.Response },
              'co-m-horizontal-nav__menu-item',
            )}
          >
            <button
              type="button"
              onClick={() => {
                setActiveParentTab(HTTPMessageTypes.Response);
                setActiveTab(ResponsePaneTab.Body);
              }}
            >
              {t(`knative-plugin~Response`)}
            </button>
          </li>
        </ul>
      </div>
      <div className="co-m-horizontal-nav">
        <ul className="co-m-horizontal-nav__menu">
          <li
            className={classNames(
              {
                'co-m-horizontal-nav-item--active':
                  activeTab === RequestPaneTab.Body || activeTab === ResponsePaneTab.Body,
              },
              'co-m-horizontal-nav__menu-item',
            )}
          >
            <button
              type="button"
              onClick={() =>
                activeParentTab === HTTPMessageTypes.Request
                  ? setActiveTab(RequestPaneTab.Body)
                  : setActiveTab(ResponsePaneTab.Body)
              }
            >
              {t(`knative-plugin~Body`)}
            </button>
          </li>
          <li
            className={classNames(
              {
                'co-m-horizontal-nav-item--active':
                  activeTab === RequestPaneTab.Options || activeTab === ResponsePaneTab.Info,
              },
              'co-m-horizontal-nav__menu-item',
            )}
          >
            <button
              type="button"
              onClick={() =>
                activeParentTab === HTTPMessageTypes.Request
                  ? setActiveTab(RequestPaneTab.Options)
                  : setActiveTab(ResponsePaneTab.Info)
              }
            >
              {activeParentTab === HTTPMessageTypes.Request
                ? t(`knative-plugin~Options`)
                : t(`knative-plugin~Info`)}
            </button>
          </li>
        </ul>
      </div>
      <br />

      {(() => {
        switch (`${activeParentTab}:${activeTab}`) {
          case `${HTTPMessageTypes.Request}:${RequestPaneTab.Body}`:
            return <RequestBody {...props} />;
          case `${HTTPMessageTypes.Request}:${RequestPaneTab.Options}`:
            return <RequestOptions {...props} />;
          case `${HTTPMessageTypes.Response}:${ResponsePaneTab.Body}`:
            return <ResponseBody {...props} />;
          case `${HTTPMessageTypes.Response}:${ResponsePaneTab.Info}`:
            return <ResponseInfo {...props} />;
          default:
            return null;
        }
      })()}
    </>
  );
};

export default ModalCompact;
