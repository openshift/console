Feature: Display options in topology
	As a user, I want to see display options  

Background:
    Given user is at the Topolgy page
    And user has selected namespace "aut-topology-displayOptions"


@regression, @manual
Scenario: Display options menu in topology with defaut options: T-07-TC10
   Given user has created deployment, deployment-config and knative-service type resources
   When user clicks on Display Options
   And user sees "Pod Count" and "Labels" under "Show" and "Expand" have options according to their presence which are "Application Groupings" and "knative Services"
   And user deselects "Labels" which is selected by default
   And user sees the labels under the workloads have dissapeared
   And user hovers over application grouping the label appears
   And user selects "Pod Count" which is deselected by default
   And user checks the workloads which shows pod count instead of buider images
   And user deselects "Application Groupings" in the Expand section
   Then user can see workloads squashed in Application grouping
#    And user selects "Application Groupings" in the Expand section
#    And user deselects "knative Services" in the Expand section
#    And user can see knative workload squashed in Application grouping
