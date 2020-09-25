Feature: Select Runtime Icon while deploying image and allow images insecure registeries
    User should be able to select the icon while deploying image


Background: 
    Given user is at Developer perspective


@regression
Scenario: Select Runtime icon while deploying secure image from external registry
    Given user is at +Add page
    When user clicks on Container Image card
    And user selects image name from external registry radio button
    And user enters the image name
    And user selects the fedora icon from Runtime Icon dropdown
    And user selects the application from Application dropdown
    And user enters the name
    And user selects the deployment type resource
    And user clicks on the Create button
    Then user will be redirected to Topology page
    And user will see the deployed image with fedora icon


@regression
Scenario: Select Runtime icon while deploying insecure image from external registry
    Given user is at +Add page
    When user clicks on Container Image card
    And user selects image name from external registry radio button
    And user enters the insecure image name
    And user checks the Allow images from internal registry checkbox
    And user selects the ansible icon from Runtime Icon dropdown
    And user selects the application from Application dropdown
    And user enters the name
    And user selects the deployment type resource
    And user clicks on the Create button
    Then user will be redirected to Topology page
    And user will see the deployed image with ansible icon


@regression, @manual
Scenario: Select Runtime icon while deploying image from internal registry
    Given user is at +Add page
    When user clicks on Container Image card
    And user selects image name from internal registry radio button
    And user selects the project from Projects dropdown
    And user selects the image from ImageStreams dropdown
    And user selects the latest tag
    And user selects the debian icon from Runtime Icon dropdown
    And user selects the application from Application dropdown
    And user enters the name
    And user selects the deployment type resource
    And user clicks on the Create button
    Then user will be redirected to Topology page
    And user will see the deployed image with debian icon


@regression
Scenario: Edit Runtime Icon while Editing Image
    Given user is at Topology page
    And topology page has a deployed image with Runtime Icon of fedora
    When user right clicks on the deployment
    And user selects Edit imagename option
    And user updates the Runtime icon to ansible
    And user clicks on Save button
    Then user will be redirected to Topology page
    And user will the deployment icon updated to ansible icon
