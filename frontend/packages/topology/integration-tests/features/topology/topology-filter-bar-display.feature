@topology
Feature: Workload Groupings in Topology
    User will be able to expand and collapse all groups on Topology graph and list view


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-display-options"
              And user is at Add page


        @smoke
        Scenario: Default state of Display dropdown: T-16-TC01
            Given user has created workload "nodejs-ex-git" with resource type "Deployment"
             When user clicks on the Display dropdown
             Then user will see the Connectivity Mode is checked
              And user will see the Expand is checked
              And user will see the Pod count is unchecked


        @regression
        Scenario: Check the Consumption Mode: T-16-TC02
            Given user is at Topology page
             When user clicks on the Display dropdown
              And user checks the Consumption Mode
             Then user will see that the Expand options are disabled


        @regression
        Scenario: Uncheck the Expand: T-16-TC03
            Given user is at Topology page
             When user clicks on the Display dropdown
              And user unchecks the Expand
             Then user will see that the Expand options are disabled


        @regression @manual
        Scenario: Provide ability to hide and show Helm release groupings in Topology graph and list view: T-16-TC04
            Given user is at the Topology page
              And user is at the graph view
             When user clicks on the Display dropdown
              And user unchecks the Helm Release checkbox
             Then user will see the Helm releases collapsed
              And user will see the summary of workloads


        @regression @manual
        Scenario: Provide ability to hide and show Knative Services groupings in Topology graph and list view: T-16-TC05
            Given user is at the Topology page
              And user is at the graph view
             When user clicks on the Display dropdown
              And user unchecks the Knative Services checkbox
             Then user will see the Knative Services collapsed
              And user will see the summary of workloads


        @regression @manual
        Scenario: Provide ability to hide and show Operator Groups groupings in Topology graph and list view: T-16-TC06
            Given user is at the Topology page
              And user is at the graph view
             When user clicks on the Display dropdown
              And user unchecks the Operator Groups checkbox
             Then user will see the Operator Groups collapsed
              And user will see the summary of workloads


        @regression @manual
        Scenario: Display options menu in topology with defaut options: T-08-TC07
            Given user has created deployment, deployment-config and knative-service resource type git workloads
             When user clicks on Display Options
              And user sees "Pod Count" and "Labels" under "Show" and "Expand" have options according to their presence which are "Application Groupings" and "knative Services"
              And user deselects "Labels" which is selected by default
              And user sees the labels under the workloads have dissapeared
              And user hovers over application grouping the label appears
              And user selects "Pod Count" which is deselected by default
              And user checks the workloads which shows pod count instead of buider images
              And user deselects "Application Groupings" in the Expand section
             Then user can see workloads squashed in Application grouping
