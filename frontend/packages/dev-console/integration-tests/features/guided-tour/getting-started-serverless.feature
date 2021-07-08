@guided-tour
Feature: Install the OpenShift Serverless Operator tour
              As a user, I want to take a guided tour of Install the OpenShift Serverless Operator feature

        Background:
            Given user is at developer perspective
              And user is at Add page


        @regression @to-do
        Scenario: Starting tour from the Add page: GT-04-TC01
            Given Build with guided documentation card is present in Add page
             When user clicks on the "Install the OpenShift Serverless Operator" link on the card to see the tour will start with link to three steps present as a sidepane with close button
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Serverless Operator was successfully installed
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Knative Serving API was installed successfully
              And user clicks on next to see "Create the Knative Eventing API" steps to create the Knative Eventing application program interface
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Knative Serving API was installed successfully
             Then user sees the message saying "Your Serverless Operator is ready"
              And user sees Exploring Serverless applications quick start link
              And user sees "Close", "Back" and "Restart"
              And user sees Complete label marked on Install the OpenShift Serverless Operator card after clicking on "close" button to close the sidepane


        @regression @to-do
        Scenario: Starting tour from the Quick Starts page: GT-04-TC02
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" on the card
              And user clicks on the "Install the OpenShift Serverless Operator" link on the card to see the tour will start with link to three steps present as a sidepane with close button
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Serverless Operator was successfully installed
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Knative Serving API was installed successfully
              And user clicks on next to see "Create the Knative Eventing API" steps to create the Knative Eventing application program interface
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Knative Eventing API was installed successfully
              And user clicks on next
             Then user sees the message saying "Your Serverless Operator is ready"
              And user sees Exploring Serverless applications quick start link
              And user sees "Close", "Back" and "Restart"
              And user sees Complete label marked on Install the OpenShift Serverless Operator card after clicking on "close" button to close the sidepane



        @regression @to-do
        Scenario: Trying 'No' option during the tour: GT-04-TC03
            Given user is at Quick Starts catalog page
             When user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start tour option to see "Install the OpenShift Serverless Operator" step is started
              And user clicks on next to see an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed
              And user selects No option
             Then user sees that the alert is saying "Try walking through the steps again to properly install Serverless Operator"


        @regression @to-do
        Scenario: Avoiding option during the tour: GT-04-TC04
            Given user is at Quick Starts catalog page
             When user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button
              And user clicks on next on "Install the OpenShift Serverless Operator" step
              And user clicks on next on "Check your work" alert
              And user clicks on next on "Create the Knative Serving API" step
              And user selects Yes option on alert "Check your work" asking to verify that the knative serving API was installed successfully
              And user clicks on next to see "Create the Knative Eventing API" step is started
              And user clicks on next
              And user selects Yes option in alert "Check your work" asking to verify that the knative eventing API was installed successfully
              And user clicks on next
              And user clicks "close" button to close the sidepane
             Then user sees Complete label marked on Install the OpenShift Serverless Operator card


        @regression @to-do
        Scenario: Review the tour: GT-04-TC05
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" link on the card
              And user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user clicks on next to see alert titled "Check your work" asking to verify that the Serverless Operator was successfully installed
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user clicks on next to see alert titled "Check your work" asking to verify that the Knative Serving API was installed successfully
              And user clicks on next to see "Create the Knative Eventing API" steps to create the Knative Eventing application program interface
              And user clicks on next to see alert titled "Check your work" asking to verify that the Knative Serving API was installed successfully
              And user clicks "Back" button to go back to previous "Check your work" alert
              And user clicks on next
              And user clicks "close" button to close the sidepane back to tour page
             Then user sees Complete label marked on Install the OpenShift Serverless Operator card


        @regression @to-do
        Scenario: Stopping and again resuming the tour: GT-04-TC06
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" link on the card
              And user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button
              And user sees "Install the OpenShift Serverless Operator" step is started
              And user closes the close button
              And user clicks on Leave button on modal "Are you sure you want to leave the tour"
              And user clicks on the "Install the OpenShift Serverless Operator" card
             Then user sees the tour will start from the step "Install the OpenShift Serverless Operator"


        @regression @to-do
        Scenario: Stopping and restarting the tour: GT-04-TC07
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" link on the card
              And user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Serverless Operator was successfully installed
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Knative Serving API was installed successfully
              And user clicks on next to see "Create the Knative Eventing API" steps to create the Knative Eventing application program interface
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Knative Serving API was installed successfully
              And user clicks on the Restart button
             Then user sees that the tour has started again


        @regression @to-do
        Scenario: Navigating between steps in the tour: GT-04-TC08
            Given user is at Quick Starts catalog page
             When user clicks on the "Install the OpenShift Serverless Operator" card
              And user clicks on the Start button to see "Install the OpenShift Serverless Operator" step for installing serverless steps
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Serverless Operator was successfully installed
              And user clicks on next to see "Create the Knative Serving API" step to create the Knative Serving application program interface
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Knative Serving API was installed successfully
              And user clicks on next to see "Create the Knative Eventing API" steps to create the Knative Eventing application program interface
              And user clicks on next
              And user selects Yes option for alert titled "Check your work" asking to verify that the Knative Serving API was installed successfully
              And user clicks on first step "Install the OpenShift Serverless Operator"
              And user clicks on next
              And user clicks on next on "Check your work" alert
             Then user sees step "Create the Knative Serving API" with Check your work alert
