angular.module('bridge.service')
.service('k8sCache', function(_, $interval, $rootScope, $routeParams, k8s, resourceMgrSvc) {
  'use strict';

  this.objects = {
    nodes: [],
    policies: [],
  }
  this.loadErrors = {
    nodes: false,
    policies: false,
  }

  const subscribe = (type, scope, onSuccess, onError) => {
    scope.$on(`k8sCache-${type}`, (event, objects) => onSuccess(objects));
    scope.$on(`k8sCache-${type}-error`, (event, err) => onError(err));

    if (this.loadErrors[type]) {
      onError();
    } else {
      onSuccess(this.objects[type]);
    }
  }

  this.subscribeToNodes = (scope, onSuccess, onError) => {
    subscribe('nodes', scope, onSuccess, onError);
  }

  this.subscribeToPolicies = (scope, onSuccess, onError) => {
    subscribe('policies', scope, onSuccess, onError);
  }

  const utilization = () => {
    const policyCounts = this.objects.nodes.reduce((accumulator, n) => {
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

    this.objects.policies.forEach((policy) => {
      const key = policy.metadata.selfLink;
      policy.metadata.utilization = Object.keys(policyCounts[key] || {}).length;
    });
  }

  const broadcastNodes = _.debounce(() => {
    utilization();
    $rootScope.$broadcast('k8sCache-nodes', this.objects.nodes);
  }, 5000, {leading: true});

  const loadNodes = () => {
    k8s.nodes.list({})
      .then(nodes => {
        this.objects.nodes.splice(0, this.objects.nodes.length);
        this.objects.nodes.push.apply(this.objects.nodes, nodes);
        this.loadErrors.nodes = false;
        broadcastNodes();
      })
      .catch(e => {
        this.objects.nodes.splice(0, this.objects.nodes.length);
        this.loadErrors.nodes = e;
        $rootScope.$broadcast('k8sCache-nodes-error', e);
      });
  }

  const events = k8s.events.nodes;
  $rootScope.$on(events.DELETED, (e, data) => {
    resourceMgrSvc.removeFromList(this.objects.nodes, data.resource);
    broadcastNodes();
  });

  $rootScope.$on(events.ADDED, (e, data) => {
    resourceMgrSvc.updateInList(this.objects.nodes, data.resource);
    broadcastNodes();
  });

  $rootScope.$on(events.MODIFIED, (e, data) => {
    resourceMgrSvc.updateInList(this.objects.nodes, data.resource);
    broadcastNodes();
  });

  const loadPolicies = () => {
    k8s.policies.get()
      .then(policies => {
        // only compare policy.policy ... angular shoves stuff into these objects
        const changed = _.find(policies.items, (p, i) => {
          if (!this.objects.policies[i]) {
            return true;
          }
          if (!_.isEqual(p.policy, this.objects.policies[i].policy)) {
            return true;
          }
        });

        if (!changed) {
          return;
        }
        this.objects.policies.splice(0, this.objects.policies.length);
        this.objects.policies.push.apply(this.objects.policies, policies.items);
        this.loadErrors.policies = false;
        utilization()
        $rootScope.$broadcast('k8sCache-policies', this.objects.policies);
      })
      .catch(e => {
        this.objects.policies.splice(0, this.objects.policies.length);
        this.loadErrors.policies = e;
        $rootScope.$broadcast('k8sCache-policies-error', e);
      });
  };


  this.start = () => {
    $interval(loadPolicies, 30 * 1000);
    loadPolicies();
    loadNodes();
  };
});
