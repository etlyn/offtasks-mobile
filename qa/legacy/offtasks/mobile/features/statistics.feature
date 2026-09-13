@e2e @mobile @statistics
# Feature code: 7
Feature: Mobile statistics screen
    The statistics screen should separate open and closed work while keeping search and restore actions available.

    Background:
        Given the tester is signed in to the mobile app
        And the drawer contains a Statistics destination

    # Scenario code: 7.1
    Scenario: Open statistics from the drawer
        When the tester opens the navigation drawer
        And the tester navigates to Statistics
        Then the statistics screen should load without leaving the authenticated shell
        And the screen should expose tabs for Open issues and Closed issues

    # Scenario code: 7.2
    Scenario: Switch between open and closed issue tabs
        Given the statistics screen is visible
        When the tester switches between Open issues and Closed issues
        Then the list content should update to match the selected tab
        And task counts or empty states should remain coherent with the chosen tab

    # Scenario code: 7.3
    Scenario: Search and restore work from statistics
        Given the statistics screen is visible
        When the tester opens search and looks for a known task
        Then matching tasks should appear in the statistics list context
        When the tester restores a completed task from the closed view
        Then the task should move back into an open workflow state

    # Scenario code: 7.4
    Scenario: Review statistics metrics and celebration feedback
        Given the statistics screen is visible
        When the tester reviews the summary area
        Then open, closed, and overdue counts should match the current task set
        And the completion celebration should not block tab, search, or refresh controls