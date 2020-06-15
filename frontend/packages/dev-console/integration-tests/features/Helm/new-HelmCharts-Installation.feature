Feature: Helm Chart
    User should able to import new Helm charts and should be ablet to install newly added xhelm charts

Background:
    Given user logged into the openshift application
    And user is at developer perspecitve

@regression 
Scenario: Add new link to fetch the new Helm Charts: HR-05-TC02
    Given user added the new link to fetch the Helm Charts
    When user clicks on the Helm Chart card on the +Add page
    Then user should see the number of Helm Charts is updated


@regression
Scenario: Install newly added Helm Charts from +Add Page using form View: HR-05-TC03
    Given user added the new link to fetch the Helm Charts
    When user clicks on the Helm Chart card on the +Add page
    And user searches for the 'Example' helm chart 
    And user clicks on the 'Exmaple' helm chart card
    And user clicks on the Install Helm Chart button
    And user selects the Form View
    And user enters the required field
    And user updates the Chart Version
    And user clicks on the Install button
    Then user should be redirected to Topology page
    And Topology page should have the helm chart workload 


@regression
Scenario: Install newly added Helm Charts from Developer Catalog Page using YAML View: HR-05-TC03
    Given user is at +Add page
    When user clicks on the Developer Catalog card on the +Add page
    And user checks the Helm Charts checkbox
    And user searches for the 'Example' helm chart 
    And user clicks on the 'Example' helm chart card
    And user clicks on the Install Helm Chart button
    And user selects the YAML View
    And user updates the Chart Version
    And user clicks on the Install button
    Then user should be redirected to Topology page
    And Topology page should have the helm chart workload 



@regression 
Scenario: Remove newly added link to go back to default Helm Charts link: HR-06-TC01
    Given user removed the newly added link to go back to default Helm Charts link
    When user clicks on the Helm Chart card on the +Add page
    Then user should see the number of Helm Charts is back to default
