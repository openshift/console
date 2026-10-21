@perspective @dev-console
Feature: Configure perspectives
              As a administrator, I want to configure the perspectives which are being shown in the Perspectives dropdown in the console, this includes enabling, disabling or adding access review checks to available perspective(s).


        Background:
            Given user has logged in as admin user

        @regression @manual
        Scenario: Configuring available perspectives: P-01-TC01
            Given user is at cluster YAML of "operator.openshift.io/v1" console
             When user adds the "Add user perspectives" code snippet under spec.customization.perspectives
              And user changes the visibility state of "admin" to "Disabled" and removes the remaining perspectives
              And user clicks on Save button
              And user clicks on Perspective dropdown
             Then user will not see "Administrator" perspective in the Perspective switcher


        @regression @manual
        Scenario: Configuring available perspectives - Add access review check: P-01-TC02
            Given user is at cluster YAML of "operator.openshift.io/v1" console
             When user adds the "Add user perspectives" code snippet under spec.customization.perspectives
              And user changes the visibility state of "admin" to "AccessReview"
              And user adds 'accessReview: {missing: [{resource: "namespaces", verb: "list"}]}' under visibility and removes the remaining perspectives
              And user clicks on Save button
              And user clicks on Perspective dropdown
             Then user will not see "Administrator" perspective in the Perspective switcher


        @regression @manual
        Scenario: Configuring available perspectives - Add empty Perspectives: P-01-TC03
            Given user is at cluster YAML of "operator.openshift.io/v1" console
             When user adds "[]" to spec.customization.perspectives
              And user clicks on Save button
              And user clicks on Perspective dropdown
             Then user will see all the available perspectives in the dropdown


        @regression
        Scenario: Enable dev perspective: P-01-TC04
            Given user is at admin perspective
            #   And user is at Cluster Settings page in administration section
            #  When user goes to configuration tab
              And user is at Search page in Home section
              And user searches "console"
              And user clicks on cluster
            #   And user selects "operator.openshift.io" console
              And user clicks the "Customize" button in the page heading
              And user selects "Enabled" in the Developer under perspective section of general customisation
             Then user will see Saved alert
              And user refreshes the page to see developer option
              And user will see developer perspective in the perspective switcher
