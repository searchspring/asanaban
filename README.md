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

## Syntax in Asana for storing Swimlanes, Columns, and column limits

An Asanaban board will build itself from a specific syntax in the naming of Asana sections that looks like this:

`swimlaneName:columnName|taskLimit`

Example: `main:To Do|5`

## How tasks are synced with Asana

Asanaban keeps your active board synced with changes made from Asana or others on Asanaban. 

When you choose a new board, it will request all the tasks from Asana and update your UI. Following the initial request, everytime you make a change to the state or location of a task it will update the Asana board.

A sync loop is also running to make sure your Asanaban is always up to date. Every 5 seconds, Asanaban will check to see if any tasks have changed state or location and will update your board with those changes if found.

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