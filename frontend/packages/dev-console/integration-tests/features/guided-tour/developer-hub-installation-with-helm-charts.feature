@guided-tour @dev-console
Feature: Install Red Hat Developer Hub (RHDH) with a Helm Chart tour
              As a user, I want to take a guided tour to deploy an application with a pipeline feature

        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "developerhub-install"

        @regression
        Scenario: Starting tour from the Add page: GT-01-TC01
            Given Build with guided documentation card is present in Add page
             When user click on Add to project icon
              And user types "Install Red Hat Developer Hub (RHDH) with a Helm Chart" in input box
              And user clicks on Start button from the quick search result
              And user see the tour will start with link to four steps present as a sidepane with close button
              And user clicks on the "Start" tour option to see "Install Red Hat Developer Hub with a Helm Chart" step to install Red Hat Developer Hub
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "verify the application was successfully created"
              And user clicks on next to see "Know how to upgrade your Red Hat Developer Hub installation" step started for upgrading developer installation
              And user selects Yes option for alert titled "Check your work" asking to "verify the application was successfully upgraded"
              And user clicks on next to see "Optional: Change the URL of your Red Hat Developer Hub instance" optional step to modify developer hub instance URL
              And user selects Yes option for alert titled "Check your work" asking to "verify the application was successfully updated"
              And user clicks on next to see "Optional: Add Red Hat Developer Hub to the OpenShift Console Application menu" optional step to add developer hub to Openshift Console menu
              And user selects Yes option for alert titled "Check your work" asking to "verify that the application menu link"
              And user clicks on next button
             Then user sees the message saying "Your Red Hat Developer Hub installation is deployed and ready."
              And user sees "Close", "Back" and "Restart"

        @regression
        Scenario: Starting tour from the Quick Starts page: GT-01-TC02
            Given Build with guided documentation card is present in Add page
             When user clicks on the link "View all quick starts" on the card
              And user clicks on the "Install Red Hat Developer Hub (RHDH) with a Helm Chart" link on the card to see the tour will start with link to four steps present as a sidepane with close button
              And user clicks on the "Start" tour option to see "Install Red Hat Developer Hub with a Helm Chart" step to install Red Hat Developer Hub
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "verify the application was successfully created"
              And user clicks on next to see "Know how to upgrade your Red Hat Developer Hub installation" step started for upgrading developer installation
              And user selects Yes option for alert titled "Check your work" asking to "verify the application was successfully upgraded"
              And user clicks on next to see "Optional: Change the URL of your Red Hat Developer Hub instance" optional step to modify developer hub instance URL
              And user selects Yes option for alert titled "Check your work" asking to "verify the application was successfully updated"
              And user clicks on next to see "Optional: Add Red Hat Developer Hub to the OpenShift Console Application menu" optional step to add developer hub to Openshift Console menu
              And user selects Yes option for alert titled "Check your work" asking to "verify that the application menu link"
              And user clicks on next button
             Then user sees the message saying "Your Red Hat Developer Hub installation is deployed and ready."
              And user sees "Close", "Back" and "Restart"
             Then user sees Complete label marked on "Install Red Hat Developer Hub (RHDH) with a Helm Chart" card

        @regression
        Scenario: Trying No option during the tour: GT-01-TC03
            Given user is at Quick Starts catalog page
             When user clicks on the "Install Red Hat Developer Hub (RHDH) with a Helm Chart" card
              And user clicks on the "Start" tour option to see "Install Red Hat Developer Hub with a Helm Chart" step to install Red Hat Developer Hub
              And user clicks on next button
              And user selects No option on alert appears "Check your work" asking to verify that your application was successfully created
             Then user sees that the alert is saying "Try the steps again"

        @regression
        Scenario: Avoiding option during the tour: GT-01-TC04
            Given user is at Quick Starts catalog page
             When user clicks on the "Install Red Hat Developer Hub (RHDH) with a Helm Chart" card
              And user clicks on the "Start" tour option to see "Install Red Hat Developer Hub with a Helm Chart" step to install Red Hat Developer Hub
              And user sees alert titled "Check your work" asking to "verify the application was successfully created"
              And user clicks on next button
              And user clicks on next to see next step "Know how to upgrade your Red Hat Developer Hub installation" started
              And user clicks on next button
              And user sees alert titled "Check your work" asking to "verify the application was successfully upgraded"
              And user clicks on next to see "Optional: Change the URL of your Red Hat Developer Hub instance" optional step to modify developer hub instance URL
              And user clicks on next button
              And user clicks on next to see next step "Optional: Add Red Hat Developer Hub to the OpenShift Console Application menu" started
              And user clicks on next button twice
             Then user sees Complete label marked on "Install Red Hat Developer Hub (RHDH) with a Helm Chart" card

        @regression
        Scenario: Review the tour: GT-01-TC05
            Given Build with guided documentation card is present in Add page
             When user clicks on the link "View all quick starts" on the card
              And user clicks on the "Install Red Hat Developer Hub (RHDH) with a Helm Chart" card
              And user clicks on the "Start" tour option to see "Install Red Hat Developer Hub with a Helm Chart" step to install Red Hat Developer Hub
              And user sees alert titled "Check your work" asking to "verify the application was successfully created"
              And user clicks on next button
              And user clicks on next to see next step "Know how to upgrade your Red Hat Developer Hub installation" started
              And user sees alert titled "Check your work" asking to "verify the application was successfully upgraded"
              And user clicks on next button
              And user clicks on next to see next step "Optional: Change the URL of your Red Hat Developer Hub instance" started
              And user sees alert titled "Check your work" asking to "verify the application was successfully updated"
              And user clicks on next button
              And user clicks on next to see next step "Optional: Add Red Hat Developer Hub to the OpenShift Console Application menu" started
              And user clicks on next button twice
             Then user sees Complete label marked on "Install Red Hat Developer Hub (RHDH) with a Helm Chart" card

        @regression
        Scenario: Stopping and again resuming the tour: GT-01-TC06
            Given Build with guided documentation card is present in Add page
             When user clicks on the link "View all quick starts" on the card
              And user clicks on the "Install Red Hat Developer Hub (RHDH) with a Helm Chart" card
              And user clicks on the "Start" tour option to see "Install Red Hat Developer Hub with a Helm Chart" step to install Red Hat Developer Hub
              And user selects Yes option on alert titled "Check your work"
              And user closes the close button
              And user clicks on Leave button on modal "Leave quick start?"
              And user clicks on the "Install Red Hat Developer Hub (RHDH) with a Helm Chart" card

        @regression
        Scenario: Navigating between steps in the tour: GT-01-TC07
            Given user is at Quick Starts catalog page
             When user clicks on the "Install Red Hat Developer Hub (RHDH) with a Helm Chart" card
              And user clicks on third step "Optional: Change the URL of your Red Hat Developer Hub instance" from the link to four steps present in the card
              And user selects Yes option in alert titled "Check your work"
              And user clicks on second step "Know how to upgrade your Red Hat Developer Hub installation"
              And user selects Yes option in alert titled "Check your work"
              And user clicks on first step "Install Red Hat Developer Hub with a Helm Chart" step
              And user selects Yes option in alert titled "Check your work"
              And user clicks on next to see step "Know how to upgrade your Red Hat Developer Hub installation" with "Check your work" alert
              And user clicks on next to see step "Optional: Change the URL of your Red Hat Developer Hub instance" with "Check your work" alert
              And user clicks on next to see step "Optional: Add Red Hat Developer Hub to the OpenShift Console Application menu" with "Check your work" alert
              And user clicks on next button twice
             Then user sees the message saying "Your Red Hat Developer Hub installation is deployed and ready."