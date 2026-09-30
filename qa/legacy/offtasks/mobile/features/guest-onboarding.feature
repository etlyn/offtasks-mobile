@e2e @mobile @guest @onboarding
Feature: Device-first workspace and optional account sync
    Users can work locally without creating an account.

    Scenario: First launch opens the device workspace
        Given a fresh simulator installation without a Supabase session
        When the splash completes
        Then Calendar, Notes, Goals and Later are available
        And no authentication form blocks the workspace

    Scenario: Guest task lifecycle survives restart
        Given the tester is using the device workspace
        When the tester creates, edits, completes and reopens a task
        And restarts the app
        Then the task content, date, category and completion state persist
        When the tester confirms task deletion
        Then the task remains absent after another restart

    Scenario: Guest notes and goals remain local
        Given the tester is not signed in
        When the tester creates, searches, pins, edits and deletes notes
        And creates a goal, adds a task to it and removes an empty goal
        Then the changes persist on the device without authenticated API calls

    Scenario: Authentication is optional and dismissible
        Given the guest workspace contains items
        When the tester opens Sign in for sync from the drawer
        And cancels sign in
        Then the guest workspace and all its items remain available

    Scenario: Account import requires confirmation and is retry safe
        Given a disposable account on an isolated Supabase backend
        And the device workspace contains tasks, notes and goals
        When the tester signs in and cancels Import device items
        Then no guest items are uploaded
        When the tester confirms Import device items twice
        Then each item appears once in the account
        And the guest copy remains unchanged

    Scenario: Account and guest data remain isolated
        Given a signed-in disposable account has synced items
        When the tester signs out
        Then the guest workspace returns without account-only items
        When another account signs in
        Then it cannot read or change the first account's items

    Scenario: Sync failure preserves local planner changes
        Given the tester is signed in to an isolated test backend
        When the backend becomes unreachable
        And the tester edits a note or goal
        Then the change is saved locally with a visible sync failure
        When connectivity returns and the tester selects Sync now
        Then another client receives the change including deletions

    Scenario: Account deletion returns to the device workspace
        Given a disposable account owns tasks, notes and goals
        When the tester confirms Delete Account
        Then its remote items and local account cache are removed
        And the separate guest workspace remains available