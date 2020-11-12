import React, { Component } from 'react';
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
    this._logout = this.props.logout.bind(this);
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

  _extend() {
    this.props.tokenRefresh();
    this._cancel();
  }

  render() {
    return (
      // TODO: i18n
      <form name="form" className="modal-content">
        <ModalTitle>세션 만료 알림</ModalTitle>
        <ModalBody>
          <div className="form-group" style={{ width: '400px' }}>
            <label className="control-label">{Math.floor(this.state.time)}초 뒤에 자동으로 로그아웃 될 예정입니다.</label>
            <label className="control-label">로그인 상태를 유지하시려면 연장 버튼을 클릭해주세요.</label>
          </div>
        </ModalBody>
        <CustomModalSubmitFooter inProgress={this.state.inProgress} leftBtnText="세션 연장" rightBtnText="로그아웃" onClickLeft={this._extend} onClickRight={this._logout} />
      </form>
    );
  }
}

export const NoticeExpirationModal_ = createModalLauncher(props => <NoticeExpirationModal path="status" title="세션 만료 알림" {...props} />);
