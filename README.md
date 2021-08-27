# [Asanaban](https://asanaban.com/#!/setup)

![Alt text](app/assets/images/screenshot.png?raw=true "Asanaban Demo")
## Kanban on Asana

Additional features beyond the Asana Kanban tool include:

- Color-coded tasks
- Limit to number of tasks per column before column turns red to warn you of too many tasks
- Shows how many tasks are in a column
- Multiple "Swimlanes" (rows) to sort tasks
- Collapsible Columns
- A variety of awesome background images to choose from 😎

## Connection to Asana for the first time

The first time you go to Asanaban, you'll be forwarded to a [setup page](https://asanaban.com/#!/setup) where you will be walked through a series of steps to connect your Asana account to Asanaban.

*Note: Asanaban information is stored in local storage so if you clear it you'll have to re-connect your Asana account*

## Syntax in Asana for storing Swimlanes, Columns, and column limits

An Asanaban board will build itself from a specific syntax in the naming of Asana sections that looks like this:

`swimlaneName:columnName|taskLimit`

Example: `main:To Do|5`

These sections have to be created __manually__ in an Asana project for Asanaban to understand the layout. "swimlaneName" can be any set of letters (not case sensitive) and so can "columnName". "taskLimit" has to be an integer value.

## How tasks are synced with Asana

Asanaban keeps your active board synced with changes made from Asana or others on Asanaban. 

When you choose a new board, it will request all the tasks from Asana and update your UI.

 Following the initial request, everytime you make a change to the state or location of a task it will update your Asanaban board, and then push those changes to Asana. When changing locations of tasks, the changes will go into a queue that will push those changes to the Asana project in the order you make the changes on your Asanaban which means no need to worry about conflicts!

A sync loop runs to make sure your Asanaban is always up to date from changes others make. Every 5 seconds, Asanaban will check to see if any tasks have changed state or location and will update your board with those incoming changes if found. The sync loop is also the process that pushes outgoing items from the queue to Asana.

## Custom fields

Asanaban uses custom fields in Asana to store information. The fields are listed below:
- color (the color of the Asanaban task)
- column-change (Timestamp of when the state of a task is changed)

Everytime you move, or edit a task, 2 actions will be added to the queue, first is the task being moved, and the second is the timestamp custom field being updated.

## Asana timeouts

From time-to-time if you leave Asanaban open for a long period of time, or your computer goes to sleep, the update requests to Asana might time out. In this case you will get a red error message on the UI that says "Cannot connect to Asana" until the connection is restored, in which case you'll get a green status message.

## Requirements
- Node
- Brunch - `npm i -g brunch`

## Running locally

Install the bits

`npm i`

Run the server

`npm start`

## Production

This app is currently hosted in Vercel on Will Warrens personal account so he is currently the only one who can deploy this.