Feature: Install the Helm Release
    As a user, I want to install the helm release

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-helm-installation"


@regression, @smoke
Scenario: The Helm Chart option on the +Add Page: HR-01-TC01
    Given user is at Add page
    Then user can see Helm Chart card on the Add page


@regression, @smoke
Scenario: Developer Catalog Page when Helm Charts checkbox is selected: HR-01-TC02, HR-02-TC02
    Given user is at Add page
    When user clicks on the Helm Chart card on the Add page
    Then user will get redirected to Developer Catalog page
    And user is able to see Helm Chart option is selected in Developer Catalog page
    And user is able to see Helm Charts cards


@regression
Scenario: Install Helm Chart from Developer Catalog Page: HR-03
    Given user is at Add page
    When user clicks on the Developer Catalog card on the Add page
    And user checks the Helm Charts checkbox
    And user searches for the "Nodejs Ex K v0.2.0" helm chart
    And user clicks on the "Nodejs Ex K v0.2.0" helm chart card
    And user clicks on the Install Helm Chart button on side bar
    And user enters Release Name as "nodejs-ex-k"
    And user clicks on the Install button
    Then user will be redirected to Topology page
    And Topology page have the helm chart workload "nodejs-ex-k"


@regression, @smoke
Scenario: Context menu options of helm release: HR-07-TC01
    Given helm release "nodejs-ex-k" is present in topology page
    When user right clicks on the helm release "nodejs-ex-k"
    Then user is able to see the context menu with actions Upgrade, Rollback and Uninstall Helm Release
