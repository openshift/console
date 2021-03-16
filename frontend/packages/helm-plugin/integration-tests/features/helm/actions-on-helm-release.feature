Feature: Perform Actions on Helm Releases
    As a user, I want to perform the actions on the helm releases in topology page

    Background:
        Given user is at developer perspective
        And user has created or selected namespace "aut-actions-helm"


    @smoke
    Scenario: Context menu options of helm release: HR-07-TC01
        Given helm release "nodejs-ex-k" is present in topology page
        And user is at the Topology page
        When user right clicks on the helm release "nodejs-ex-k" to open the context menu
        Then user is able to see the context menu with actions Upgrade, Rollback and Uninstall Helm Release


    @smoke
    Scenario: Actions drop down on the side bar: HR-10-TC08
        Given user is at the Topology page
        And user is on the topology sidebar of the helm release "nodejs-ex-k"
        When user clicks on the Actions drop down menu
        Then user is able to see the actions dropdown menu with actions Upgrade, Rollback and Uninstall Helm Release


    @smoke
    Scenario: Actions menu on Helm page
        Given user is on the Helm page with helm release "nodejs-ex-k"
        When user clicks on the Kebab menu
        Then user is able to see kebab menu with actions Upgrade, Rollback and Uninstall Helm Release


    @smoke
    Scenario: Perform Upgrade action on Helm Release through Context Menu: HR-08-TC02
        Given user is at the Topology page
        When user right clicks on the helm release "nodejs-ex-k" to open the context menu
        And user clicks on the "Upgrade" action
        And user upgrades the chart Version
        And user clicks on the upgrade button
        Then user will be redirected to Topology page


    @smoke
    Scenario: Perform Rollback action on Helm Release through Context Menu: HR-08-TC03
        Given user is at the Topology page
        When user right clicks on the helm release "nodejs-ex-k" to open the context menu
        And user clicks on the "Rollback" action
        And user selects the version to Rollback
        And user clicks on the rollback button
        Then user will be redirected to Topology page


    @smoke
    Scenario: Uninstall Helm Release through Context Menu: HR-08-TC04
        Given user is at the Topology page
        When user right clicks on the helm release "nodejs-ex-k" to open the context menu
        And user clicks on the "Uninstall Helm Release" action
        And user enters the release name
        And user clicks on the Uninstall button
        Then user will be redirected to Topology page with no workloads
