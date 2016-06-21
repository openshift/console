'use strict';

const ENDPOINTS = ['nodes', 'policies', 'configmaps', 'namespaces'];

const eventName = (name, error) => {
  return `k8sCache-${name}${error && '-error' }`;
}
const policyUtilization = (nodes, policies) => {
  const policyCounts = nodes.reduce((accumulator, n) => {
    const annotations = n.metadata.annotations;
    if (!annotations || !annotations['tpm.coreos.com/logstate']) {
      return accumulator;
    }
    JSON.parse(annotations['tpm.coreos.com/logstate'])
      .forEach(l => {
        const policy = l.Policyref;
        if (!policy || l.invalid) {
          // invalid event (not matched by a policy)
          return;
        }
        if (!accumulator[policy]) {
          accumulator[policy] = {};
        }
        accumulator[policy][n.metadata.uid] = 1
      });
    return accumulator;
  }, {});

  policies.forEach((policy) => {
    const key = policy.metadata.selfLink;
    policy.metadata.utilization = Object.keys(policyCounts[key] || {}).length;
  });
}

angular.module('bridge.service')
.service('k8sCache', function(_, $timeout, $rootScope, k8s, resourceMgrSvc) {
  'use strict';

  this.objects = {};
  this.loadErrors = {};

  ENDPOINTS.forEach(name => {
    this.objects[name] = [];
    this.loadErrors[name] = false;
  });


  const broadcast = (name, err) => {
    // :(
    if (name === 'nodes' || name === 'policies') {
      policyUtilization(this.objects.nodes, this.objects.policies);
    }
    $rootScope.$broadcast(eventName(name, err), err ? this.loadErrors[name] : this.objects[name]);
  };

  this.loaders = {
    policies: () => {
      // TODO: bind broadcast to this function to debounce it...
      // K8s 3rd party watching is currently broken
      const policies = this.objects.policies;
      k8s.policies.get()
      .then(newPolicies => {
        $timeout(this.loaders.policies, 30 * 1000);
        // only compare policy.policy ... angular shoves stuff into these objects
        const changed = _.find(newPolicies.items, (p, i) => {
          if (!policies[i]) {
            return true;
          }
          if (!_.isEqual(p.policy, policies[i].policy)) {
            return true;
          }
        });

        if (!changed) {
          return;
        }
        policies.splice(0, policies.length);
        policies.push.apply(policies, newPolicies.items);
        this.loadErrors.policies = false;
        policyUtilization(this.objects.nodes, policies);
        $rootScope.$broadcast(eventName('policies'), policies);
      })
      .catch(e => {
        policies.splice(0, policies.length);
        this.loadErrors.policies = e;
        $rootScope.$broadcast(eventName('policies', true), e);
      });
    }
  };

  ENDPOINTS.forEach(name => {
    const objects = this.objects[name];
    const events = k8s.events[name];
    const broadcast_ = _.debounce(broadcast, 5000, {leading: true}, name);

    $rootScope.$on(events.DELETED, (e, data) => {
      resourceMgrSvc.removeFromList(objects, data.resource);
      broadcast_(name);
    });

    $rootScope.$on(events.ADDED, (e, data) => {
      resourceMgrSvc.updateInList(objects, data.resource);
      broadcast_(name);
    });

    $rootScope.$on(events.MODIFIED, (e, data) => {
      resourceMgrSvc.updateInList(objects, data.resource);
      broadcast_(name);
    });

    this[`${name}Changed`] = (scope, onSuccess, onError) => {
      scope.$on(eventName(name), (event, objects) => onSuccess(objects));
      scope.$on(eventName(name, true), (event, err) => onError(err));

      if (this.loadErrors[name]) {
        onError();
      } else {
        onSuccess(objects);
      }
    };

    if (this.loaders[name]) {
      return;
    }

    this.loaders[name] = () => {
      // TODO: fix websocket race condition...
      k8s[name].list({})
        .then(newObjects => {
          objects.splice(0, objects.length);
          objects.push.apply(objects, newObjects);
          this.loadErrors[name] = false;
          broadcast_(name);
        })
        .catch(e => {
          objects.splice(0, objects.length);
          this.loadErrors[name] = e;
          $rootScope.$broadcast(eventName(name, true), e);
        });
    }
  });

  this.start = () => _.each(this.loaders, l => l());
});
