angular.module('creme.ui')
.directive('tecPlanSelector', function(productSvc, signupSvc) {
  'use strict';
  return {
    templateUrl: '/static/module/ui/plan-selector.html',
    restrict: 'E',
    scope: {
      product: '=',
      plans: '=',
      selectedPlan: '=',
    },
    controller: function($scope) {
      $scope.tabName = 'monthly';
      $scope.getPrice = productSvc.price;
      $scope.sortedPlans = null;

      $scope.isSelected = function(p) {
        return $scope.selectedPlan && p && $scope.selectedPlan.name === p.name;
      };

      $scope.selectPlan = function(p) {
        $scope.selectedPlan = signupSvc.selectPlan(p.name);
      };

      $scope.contactSalesLink = function(plan) {
        return productSvc.contactLink($scope.product, plan);
      };

      $scope.$watch('plans', function(plans) {
        if (_.isEmpty(plans)) {
          return;
        }
        $scope.sortedPlans = _.sortBy($scope.plans, 'order');
        if (!$scope.selectedPlan) {
          $scope.selectPlan($scope.sortedPlans[0]);
        }
      });
    },
  };
})

.directive('tecTabbedPlanSelector', function(productSvc, signupSvc) {
  'use strict';
  return {
    templateUrl: '/static/module/ui/tabbed-plan-selector.html',
    restrict: 'E',
    scope: {
      product: '=',
      selectedPlan: '=',
    },
    controller: function($scope) {
      $scope.tabName = 'monthly';
      if ($scope.selectedPlan && $scope.selectedPlan.durationPeriod === 'years') {
        $scope.tabName = 'annual';
      }

      $scope.$watch('tabName', tabChanged);
      $scope.visiblePlans = null;

      function tabChanged() {
        var sortedVisible;
        switch ($scope.tabName) {
        case 'monthly':
          $scope.visiblePlans = _.filter($scope.product.ratePlans, $scope.isMonthly);
          if (!$scope.isMonthly($scope.selectedPlan)) {
            $scope.selectedPlan = null;
          }
          break;
        case 'annual':
          $scope.visiblePlans = _.filter($scope.product.ratePlans, $scope.isAnnual);
          if (!$scope.isAnnual($scope.selectedPlan)) {
            $scope.selectedPlan = null;
          }
          break;
        }

        sortedVisible = _.sortBy($scope.visiblePlans, 'order');
        if (sortedVisible.length && !$scope.selectedPlan) {
          $scope.selectedPlan = signupSvc.selectPlan(sortedVisible[0].name);
        }
      }

      $scope.isMonthly = function(plan) {
        return plan && plan.durationPeriod === 'months';
      };

      $scope.isAnnual = function(plan) {
        return plan && plan.durationPeriod === 'years';
      };

    },
  };
})

.directive('tecTierSelector', function(_, productSvc, signupSvc) {
  'use strict';
  return {
    templateUrl: '/static/module/ui/tier-selector.html',
    restrict: 'E',
    scope: {
      plan: '=',
      pricingComponentName: '@',
      selectedTiers: '=',
    },
    controller: function($scope) {
      $scope.isSelected = function(t) {
        return _.includes($scope.selectedTiers, t);
      };

      $scope.selectTier = function(t) {
        t.pricingComponentID = $scope.pricingComponent.id;
        $scope.selectedTiers = signupSvc.selectTiers([t]);
      };

      $scope.getPrice = function(t) {
        return t.price;
      };

      $scope.$watch('plan', function(p) {
        if (!p || !p.pricingComponents) {
          return;
        }
        $scope.pricingComponent = _.findWhere($scope.plan.pricingComponents, { name: $scope.pricingComponentName });
        $scope.pricingComponent.tiers = _.sortBy($scope.pricingComponent.tiers, 'price');
        if (_.isEmpty($scope.selectedTiers) && !_.isEmpty($scope.pricingComponent.tiers)) {
          $scope.selectTier($scope.pricingComponent.tiers[0]);
        }
      });

    },
  };
});
