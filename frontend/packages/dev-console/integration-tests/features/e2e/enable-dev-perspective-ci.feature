@add-flow @smoke
Feature: Enable dev perspective
              As a user, I should be able to enable dev perspective from UI

        Background:
            Given user has only admin perspective enabled
              And user has logged in as admin user


        Scenario: Enable dev perspective: P-01-TC04
            Given user is at admin perspective
              And user is at Search page in Home section
              And user searches "console"
              And user clicks on cluster
              And user clicks the "Customize" button in the page heading
              And user selects "Enabled" in the Developer under perspective section of general customisation
             Then user will see Saved alert
              And user refreshes the page to see developer option
              And user will see developer perspective in the perspective switcher
