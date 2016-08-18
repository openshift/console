import { commitPhases } from './actions';
import * as Forms from '../components/forms';
import { Base } from '../components/base';


export class Routes {
  constructor(store) {
    this.path = '/';
    this.component = Base;

    // The order of childRoutes doesn't matter to the router, but it
    // does matter to the wizard/paging code - add routes in
    // Wizard/Pager order.
    this.childRoutes = [
      {path: '/define/overview', component: Forms.Overview, title: 'Overview'},
      {path: '/define/cluster-info', component: Forms.ClusterInfo, title: 'Cluster Info'},
      {path: '/define/database-configuration', component: Forms.DatabaseConfiguration, title: 'Database Configuration'},
      {path: '/define/bootcfg', component: Forms.Bootcfg, title: 'Bootcfg Address'},
      {path: '/define/credentials', component: Forms.Credentials, title: 'Bootcfg Credentials'},
      {path: '/define/size', component: Forms.Size, title: 'Cluster Size'},
      {path: '/define/ssh-keys', component: Forms.SSHKeys, title: 'SSH Keys'},
      {path: '/define/network', component: Forms.Network, title: 'Networking'},
      {path: '/define/controllers', component: Forms.Controllers, title: 'Define Controllers'},
      {path: '/define/workers', component: Forms.Workers, title: 'Define Workers'},
      {path: '/define/users', component: Forms.Users, title: 'User Directory'},
      {path: '/define/confirm', component: Forms.Confirm, title: 'Confirm'},
      {path: '/boot/poweron', component: Forms.PowerOn, title: 'Power On'},
      {path: '/boot/connect', component: Forms.Connect, title: 'Connect Nodes'},
      {path: '/boot/configure', component: Forms.Configure, title: 'Configure Tectonic'},
    ];

    this.indexRoute = {
      onEnter: (nextstate, replace) => {
        replace(this.childRoutes[0].path);
      },
    };

    this.sections = {define: [], boot: []};
    this.childRoutes.forEach((r, ix) => {
      r.index = ix;
      r.section = r.path.match(/^\/define/) ? 'define' : 'boot';
      this.sections[r.section].push(r);

      r.onEnter = (nextstate, replace) => {
        const state = store.getState();
        const pageStart = this.firstNavigablePage(state);
        const pageLimit = this.lastNavigablePage(state);
        if (ix > pageLimit) {
          replace(this.childRoutes[pageLimit].path);
        }
        if (ix < pageStart) {
          replace(this.childRoutes[pageStart].path);
        }
      };
    });
  }

  firstNavigablePage({commitState, cluster}) {
    if (cluster.ready) {
      return this.childRoutes.findIndex(r => r.section === 'boot');
    }

    if (commitState.phase !== commitPhases.IDLE &&
        commitState.phase !== commitPhases.FAILED) {
      return this.childRoutes.findIndex(r => r.component === Forms.Confirm);
    }

    return 0;
  }

  lastNavigablePage(state) {
    const beginPage = this.firstNavigablePage(state);
    const validPages = this.childRoutes.map(r => r.component.isValid(state));
    const firstBadAfterBegin = validPages.slice(beginPage).findIndex(x => !x);

    return firstBadAfterBegin >= 0 ? beginPage + firstBadAfterBegin : validPages.length;
  }

  activeChild(router) {
    return this.childRoutes.find(r => {
      return router.isActive({pathname: r.path});
    });
  }

  pathFromIndex(index) {
    return (this.childRoutes[index] || {}).path;
  }

  sectionContainingRoute(route) {
    return this.childRoutes.filter(r => r.section === route.section);
  }
}
