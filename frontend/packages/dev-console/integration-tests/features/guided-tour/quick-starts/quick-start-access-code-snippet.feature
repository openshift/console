@guided-tour @dev-console
Feature: Access a code snippet from a quick start
              As a user, I want to be able to visualize seeing a CLI snippet in Quick Starts differently, able to copy it and if Web Terminal is installed, I should have an option to execute the command directly without having to copy/paste

        Background:
            Given user has installed Web Terminal Operator
              And user is at developer perspective
              And user has created or selected namespace "guided-tour"
              And user has applied "copy-execute-demo.yaml"
              And user is at Add page

        @regression
        Scenario: Copy to clipboard tooltip with code snippet: QS-02-TC01
            Given user is at Quick Starts catalog page
             When user clicks on the "Create ruby app" Quick Starts card
              And user clicks on Step 1
              And user hovers on the copy icon in the code snippet
             Then user can see "Copy to clipboard" tooltip appears after hover

        @regression
        Scenario: Copied to clipboard option with code snippet: QS-02-TC02
            Given user is at Quick Starts catalog page
             When user clicks on the "Create ruby app" Quick Starts card
              And user clicks on the Start button
              And user sees that "Create ruby app" step has started
              And user clicks on the copy icon in the code snippet
             Then user can see "Successfully copied to clipboard!" tooltip appears after click

        @regression @manual
        Scenario: Copy to clipboard option once code snippet has been copied: QS-02-TC03
            Given user is at Quick Starts catalog page
             When user clicks on the "Create ruby app" Quick Starts card
              And user clicks on the Start button
              And user sees that "Create ruby app" step has started
              And user has copied the code snippet
              And user removes the mouse focus from the code snippet
              And user hovers on the copy icon in the code snippet
             Then user can see "Copy to clipboard" tooltip appears

        @regression
        Scenario: Run in Web Terminal tooltip with code snippet: QS-02-TC04
            Given user is at Quick Starts catalog page
             When user clicks on the "Create ruby app" Quick Starts card
              And user clicks on the Start button
              And user sees that "Create ruby app" step has started
              And user hovers on the play icon in the code snippet
             Then user can see "Run in Web Terminal" tooltip appears for executing the code in terminal

        @regression @manual
        Scenario: Running in Web Terminal tooltip with code snippet: QS-02-TC05
            Given user is at Quick Starts catalog page
             When user clicks on "Create ruby app" Quick Starts card
              And user clicks on Step 1
              And user clicks on the play icon in the code snippet
             Then user can see "Running in Web Terminal" tooltip appears
              And user can see Web Terminal opens
              And user can see the code snippet running in the Web Terminal


        @regression @manual
        Scenario: Running in Web Terminal action has run once: QS-02-TC06
            Given user has the "Create ruby app" Quick Starts side panel open
              And user has ran code snippet in web terminal
             Then user can see checkmark icon in place of play icon


        @regression @manual
        Scenario: Run in Web Terminal option after running in Web Terminal action has been executed: QS-02-TC07
            Given user has the "Create ruby app" Quick Starts side panel open
              And user has ran code snippet in web terminal
             When user clicks on next step in the Quick Start
             Then user can see play icon
              And user can see "Run in Web Terminal" tooltip while hovering
