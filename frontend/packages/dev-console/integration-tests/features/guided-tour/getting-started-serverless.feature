@guided-tour @dev-console
Feature: Install the OpenShift Serverless Operator tour
              As a user, I want to take a guided tour of Install the OpenShift Serverless Operator feature

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "serverless-tour"
              And user is at Add page

        @regression
        Scenario: Starting tour from the Add page: GT-04-TC01
            Given Build with guided documentation card is present in Add page
             When user click on Add to project icon
              And user types "Install the OpenShift Serverless Operator" in input box
              And user clicks on Start button from the quick search result
              And user sees the tour will start with a link to the three steps present as a sidebar with a start button
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the OpenShift Serverless Operator is installed"
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the Knative Serving API was installed successfully"
              And user clicks on next to see "Create the Knative Eventing API" step to create the Knative Eventing application program interface
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the Knative Eventing API was installed successfully"
              And user clicks on next button
             Then user sees the message saying "Your Serverless Operator is ready"
              And user sees "Close", "Back" and "Restart"

        @regression
        Scenario: Starting tour from the Quick Starts page: GT-04-TC02
            Given Build with guided documentation card is present in Add page
             When user clicks on the link "View all quick starts" on the card
              And user clicks on the "Install the OpenShift Serverless Operator" link on the card to see the tour will start with link to three steps present as a sidepane with close button
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the OpenShift Serverless Operator is installed"
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the Knative Serving API was installed successfully"
              And user clicks on next to see "Create the Knative Eventing API" step to create the Knative Eventing application program interface
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the Knative Eventing API was installed successfully"
              And user clicks on next button
             Then user sees the message saying "Your Serverless Operator is ready"
              And user sees "Close", "Back" and "Restart"
              And user sees Complete label marked on "Install the OpenShift Serverless Operator" card

        @regression
        Scenario: Trying 'No' option during the tour: GT-04-TC03
            Given user is at Quick Starts catalog page
             When user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start tour option to see "Install the OpenShift Serverless Operator" step is started
              And user clicks on next to see an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed
              And user selects No option
              And user clicks on next button
             Then user sees that the alert is saying "Try the steps again"

        @regression
        Scenario: Avoiding option during the tour: GT-04-TC04
            Given user is at Quick Starts catalog page
             When user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button
              And user clicks on next on "Install the OpenShift Serverless Operator" step
              And user clicks on next on "Check your work" alert
              And user clicks on next on "Create the Knative Serving API" step
              And user selects Yes option for the alert "Check your work" asking to "Verify that the Knative Serving API was installed successfully"
              And user clicks on next button
              And user clicks on next on "Create the Knative Eventing API" step
              And user selects Yes option for the alert "Check your work" asking to "Verify that the Knative Eventing API was installed successfully"
              And user clicks on next button
             Then user sees Complete label marked on "Install the OpenShift Serverless Operator" card

        @regression
        Scenario: Review the tour: GT-04-TC05
            Given Build with guided documentation card is present in Add page
             When user clicks on the link "View all quick starts" on the card
              And user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user sees alert titled "Check your work" asking to "Verify that the OpenShift Serverless Operator is installed"
              And user clicks on next button
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user sees alert titled "Check your work" asking to "Verify that the Knative Serving API was installed successfully"
              And user clicks on next button
              And user clicks on next to see "Create the Knative Eventing API" step to create the Knative Eventing application program interface
              And user sees alert titled "Check your work" asking to "Verify that the Knative Eventing API was installed successfully"
              And user clicks on next button twice
              And user clicks "Back" button to go back to previous "Check your work" alert
             Then user sees Complete label marked on "Install the OpenShift Serverless Operator" card

        @regression
        Scenario: Stopping and again resuming the tour: GT-04-TC06
            Given Build with guided documentation card is present in Add page
             When user clicks on the link "View all quick starts" on the card
              And user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button
              And user sees "Install the OpenShift Serverless Operator" step is started
              And user closes the close button
              And user clicks on Leave button on modal "Leave quick start?"
              And user clicks on the "Install the OpenShift Serverless Operator" card
             Then user sees the tour will start from the step "Install the OpenShift Serverless Operator"

        @regression
        Scenario: Stopping and restarting the tour: GT-04-TC07
            Given Build with guided documentation card is present in Add page
             When user clicks on the link "View all quick starts" on the card
              And user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the OpenShift Serverless Operator is installed"
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the Knative Serving API was installed successfully"
              And user clicks on next to see "Create the Knative Eventing API" step to create the Knative Eventing application program interface
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the Knative Eventing API was installed successfully"
              And user clicks on the Restart button
             Then user sees that the tour has started again
              And user clicks on the Start button

        @regression
        Scenario: Navigating between steps in the tour: GT-04-TC08
            Given user is at Quick Starts catalog page
             When user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the OpenShift Serverless Operator is installed"
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the Knative Serving API was installed successfully"
              And user clicks on next to see "Create the Knative Eventing API" step to create the Knative Eventing application program interface
              And user clicks on next button
              And user selects Yes option for alert titled "Check your work" asking to "Verify that the Knative Eventing API was installed successfully"
              And user clicks on first step "Install the OpenShift Serverless Operator"
              And user clicks on next on "Check your work" alert
             Then user sees step "Create the Knative Serving API" with Check your work alert
