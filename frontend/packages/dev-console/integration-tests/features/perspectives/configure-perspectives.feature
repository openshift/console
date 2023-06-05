@perspective @dev-console
Feature: Configure perspectives
              As a administrator, I want to configure the perspectives which are being shown in the Perspectives dropdown in the console, this includes enabling, disabling or adding access review checks to available perspective(s).


        Background:
            Given user has created or selected namespace "aut-perspective"
 
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
              And user adds "accessReview: {missing: [{resource: "namespaces", verb: "list"}]}" under visibility and removes the remaining perspectives
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