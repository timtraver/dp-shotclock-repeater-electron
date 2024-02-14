# DigitalPool Shot Clock Repeater Electron App
# @author Tim Traver <timtraver@gmail.com>
# @version 1.0
# @see {@link https://github.com/timtraver/dp-shotclock-repeater-electron}
# @description : This code is to provide a central location for a Shot Clock coordinator between an 'Admin' screen that is controlling the shot clock, and any overlays or screens that are following a particular match.
 
# Getting Started with DigitalPool ShotClock Repeater Electron

This is a project providing an electron application that can be compiled for Mac and Windows desktops to run a websocket repeater that ShotClock functions can connect to for sharing particular matches shot clocks between overlays.

It has an admin screen that shows console messages from the app, and the configuration react front end allows you to start the application on a local IP address and port, and copy a publicly available URL to your DigitalPool tournament settings

## Requirements
This environment is run on top of a node back end, so whatever system you are on needs to have the latest node version running.

## Available Scripts

In the project directory, you can run:

### `npm run install` 
### `npm run dev` 

This installs all of the node dependencies and runs the application in developement mode locally and brings up the admin window for you to start the application on a particular port.

### To build the electron distribution

Run `npm run build`

Then `npx electron-builder build --mac` for the mac dmg installer

Then `npx electron-builder build --win` for the win exe installer

Those files will reside in the dist directory



