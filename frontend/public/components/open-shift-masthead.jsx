import * as React from 'react';
import { Link } from 'react-router-dom';
import * as headerLogoImg from '../imgs/header-logo.svg';

export const OpenShiftMasthead = () => <div className="os-masthead">
  <header role="banner">
    <div className="os-header">
      <div className="os-header__logo">
        <Link to="/">
          <img src={headerLogoImg} id="header-logo" />
        </Link>
      </div>
      <div className="os-header__console-picker">
        <span>Cluster Console</span>
      </div>
      <div className="os-header__user">
      </div>
    </div>
  </header>
</div>;
