Feature: Actions on Helm release in topology page
    User will be able to open the context menu and side bar for the helm releases

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-helm-sidebar"
    And helm release "nodejs-ex-k" is present in topology page


@regression, @smoke
Scenario: Context menu options of helm release: HR-07-TC01
    Given helm release "nodejs-ex-k" is present in topology page
    When user right clicks on the helm release "nodejs-ex-k"
    Then user is able to see the context menu with actions Upgrade, Rollback and Uninstall Helm Release


@regression, @smoke
Scenario: Open Side Bar for the Helm release: HR-10-TC01, HR-10-TC02
    Given user is at the Topolgy page
    When user clicks on the helm release "nodejs-ex-k"
    Then user will see the sidebar for the helm release
    And user will see the Details, Resources, Release Notes tabs


@regression
Scenario: Deployment Configs link on the sidebar for the Helm Release: HR-10-TC03
    Given user is on the topology sidebar of the helm release "nodejs-ex-k"
    When user switches to the Resources tab
    And user clicks on the link for the deployment config of helm release
    Then user is redirected to the Deployment Config Details page for the helm release


@regression
Scenario: Build Configs link on the sidebar for the Helm Release: HR-10-TC04
    Given user is on the topology sidebar of the helm release "nodejs-ex-k"
    When user switches to the Resources tab
    And user clicks on the link for the build config of helm release
    Then user is redirected to the Build Config Details page for the helm release


@regression
Scenario: Services link on the sidebar for the Helm Release: HR-10-TC05
    Given user is on the topology sidebar of the helm release "nodejs-ex-k"
    When user switches to the Resources tab
    And user clicks on the link for the services of helm release
    Then user is redirected to the Service Details page for the helm release


@regression
Scenario: Image Streams link on the sidebar for the Helm Release: HR-10-TC06
    Given user is on the topology sidebar of the helm release "nodejs-ex-k"
    When user switches to the Resources tab
    And user clicks on the link for the image stream of helm release
    Then user is redirected to the Image Stream Details page for the helm release


@regression
Scenario: Routes link on the sidebar for the Helm Release: HR-10-TC07
    Given user is on the topology sidebar of the helm release "nodejs-ex-k"
    When user switches to the Resources tab
    And user clicks on the link for the routes of helm release
    Then user is redirected to the Route Details page for the helm release


@regression, @smoke
Scenario: Actions drop down on the side bar: HR-10-TC08
    Given user is on the topology sidebar of the helm release "nodejs-ex-k"
    When user clicks on the Actions drop down menu
    Then user will see the "Upgrade" action item
    And user will see the "Rollback" action item
    And user will see the "Uninstall Helm Release" action item
