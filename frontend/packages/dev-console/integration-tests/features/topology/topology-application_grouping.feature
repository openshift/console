Feature: Application groupings in topology
	As a user, I want to check application groupings  

Background:
    Given user is at dev perspecitve
    And open project namespace "aut-topology-grouping"
   #  And user is at the topolgy page
    

@regression, @smoke
Scenario: Verify Application grouping sidebar: T-04-TC08
   Given topology has application name with node name "nodejs-ex-git"
   When user clicks on an applicaton grouping
   Then user can see application sidebar
   And user can confirm the workload information present under resources in the sidebar
   And user can see Add to Application and Delete Application in the Action menu


@regression, @smoke
Scenario: Verify Application grouping context menu : T-06-TC04
   Given topology has application name with node name "nodejs-ex-git-1"
   When user right click on Application to open context menu
   Then user can view Add to Application and Delete Application options
