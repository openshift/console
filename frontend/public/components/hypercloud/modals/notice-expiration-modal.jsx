import React, { Component } from 'react';
import { Translation } from 'react-i18next';
import { createModalLauncher, ModalBody, ModalTitle } from '../../factory';
import { CustomModalSubmitFooter } from './modal';

let timerID = 0;

class NoticeExpirationModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: this.props.time,
    };

    this._cancel = props.cancel.bind(this);
    this._logout = this._logout.bind(this);
    this._extend = this._extend.bind(this);
  }

  componentDidMount() {
    // 타이머 등록
    timerID = window.setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    // 타이머 등록 해제
    window.clearInterval(timerID);
  }

  tick() {
    this.setState({ time: Math.floor(this.state.time - 1) });
    if (Math.floor(this.state.time) === 0) {
      this._logout();
    }
  }
  _logout(e) {
    e.preventDefault();
    this.props.logout();
    this._cancel();
  }

  _extend() {
    this.props.tokenRefresh();
    this._cancel();
  }

  render() {
    return (
      <Translation>
        {t => (
          <>
            <form name="form" className="modal-content">
              <ModalTitle>{t('COMMON:MSG_GNB_SESSION_9')}</ModalTitle>
              <ModalBody>
                <div className="form-group">
                  <label className="control-label">
                    {t('COMMON:MSG_GNB_SESSION_10', {
                      count: Math.floor(this.state.time),
                    })}
                  </label>
                </div>
              </ModalBody>
              <CustomModalSubmitFooter inProgress={false} leftBtnText={t('COMMON:MSG_GNB_SESSION_9')} rightBtnText={t('COMMON:MSG_GNB_ACCOUNT_2')} onClickLeft={this._extend} onClickRight={this._logout} />
            </form>
          </>
        )}
      </Translation>
    );
  }
}

export const NoticeExpirationModal_ = createModalLauncher(props => <Translation>{t => <NoticeExpirationModal path="status" title={t('COMMON:MSG_GNB_SESSION_9')} {...props} />}</Translation>);
