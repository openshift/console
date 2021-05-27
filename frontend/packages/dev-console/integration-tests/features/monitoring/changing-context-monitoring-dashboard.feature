@monitoring
Feature: Changing context in Monitoring Dashboard
              As a user, I should be able to change the filter in the Monitoring Dashboard


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-monitoring"
              And user has created workload "nodejs-ex-git" with resource type "Deployment"


        @regression @to-do
        Scenario: Charts display in monitoring dashboard for specific workload: M-01-TC01
            Given user is at the Topology page
             When user selects the workload "nodejs-ex-git" to open the topology sidebar
              And user navigates to monitoring dashboard from toplogy sidebar
             Then user is able to see the workload "nodejs-ex-git" in worloads dropdown
              And user is able to see charts for the displayed workload


        @regression @to-do
        Scenario: Charts display in monitoring dashboard for all workloads: M-01-TC02
            Given user is in topology view with workloads
             When user selects the workload "nodejs-ex-git" to open the topology sidebar
              And user navigates to monitoring dashboard from toplogy sidebar
              And user selects "All Workloads" from workloads dropdown
             Then user is able to see charts for all the workloads present in the namespace "aut-monitoring"


        @regression @to-do
        Scenario: Charts display in monitoring dashboard for all workloads: M-01-TC03
            Given user is at the Monitoring dashboard
             When user clicks on filter dropdown
              And user checks filter dropdown will be autopopulated with "All Workloads"
              And user selects one workload
             Then user checks for charts of the workload


        @regression @to-do
        Scenario: Restore the selected workload on refresh: M-01-TC04
            Given user is at the Monitoring dashboard
             When user clicks on filter dropdown
              And user selects workload "nodejs-ex-git" from the workloads
              And user refreshes the page
             Then user is still able to see the same workload "nodejs-ex-git"


        @regression @to-do
        Scenario: Switiching to different project resests the workload: M-01-TC05
            Given user is at the Monitoring dashboard
             When user clicks on filter dropdown
              And user selects workload "nodejs-ex-git" from the workloads
              And user switches to a different project from project selector
             Then filter dropdown option will be set to "All workloads"
