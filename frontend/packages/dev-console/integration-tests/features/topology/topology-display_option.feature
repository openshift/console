Feature: Display options in topology
	As a user, I want to see display options  

Background:
    Given user is at Topology page
    And open project namespace "aut-topology-displayOptions"


@regression
Scenario: Display options menu in topology with defaut options: T-07-TC10
   Given topology has deployment,deployment-config and knative workloads
   When user clicks on Display Options on top of topology
   And user sees "Pod Count" and "Labels" under "Show" and "Expand" have options according to their presence which are "Application Groupings" and "Knative Services"
   And user deselect "Labels" which is selected by default
   And user sees the labels under the workloads have dissapeared
   And user hover over application grouping the label appears
   And user select "Pod Count" which is deselected by default
   And user checks the workloads which shows pod count instead of buider images
   And user deselect "Application Groupings" in the Expand section
   Then user can see workloads squashed in Application grouping
   And user select "Application Groupings" in the Expand section
   And user deselect "Knative Services" in the Expand section
   And user can see knative workload squashed in Application grouping
