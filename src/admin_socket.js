/**
 * admin_socket.js
 * @author Tim Traver <timtraver@gmail.com>
 * @version 1.0
 * @see {@link http://github.com|GitHub}
 * @description : Class to open an admin web socket for the react app to talk to and get the electron
 * to restart the main web socket services
 */

import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import SocketServer from './repeater_socket.js';

export default class AdminSocketManager {

    constructor(address, port) {
        // Set class property variables
        this.adminIpAddress = address;
        this.adminPort = port;
        this.adminApp;
        this.adminServer;
        this.adminIo;
        this.repeaterIpAddress;
        this.repeaterPort;
        this.repeaterIsRunning = false;
        this.repeater;
        this.messageCheckInterval;
        this.messageId = 1;
    }

    startAdminSocket() {
        this.adminApp = express();
        this.adminServer = createServer(this.adminApp);
        this.adminIo = new Server(this.adminServer, {
            cors: {
                origin: "*"
            }
        });

        // Set the events for the server connections
        this.adminIo.on('connection', (socket) => {
            console.log('Connection established to admin socket from client : ', socket.id);
            // This is a command to start the repeater socket services on a partciular address and port
            socket.on('start', (data) => {
                console.log('Admin : Got a start message from client : ', data);
                this.repeaterIpAddress = data.address;
                this.repeaterPort = data.port;
                this.startRepeaterSocket();
                return;
            });

            socket.on('disconnect', () => {
                console.log('Admin client disconnected : ', socket.id);
            });

        });

        this.adminIo.listen(this.adminServer);
        this.adminServer.listen(this.adminPort, this.adminIpAddress, () => {
            console.log('Admin socket started and listening at http://' + this.adminIpAddress + ':' + this.adminPort);
        });
        return;
    }
    // Method to start up an repeater service on a particular IP and port
    startRepeaterSocket() {
        if (this.repeaterIsRunning) {
            // If the service has already been started, then it needs to be stopped first
            this.stopRepeaterSocket();
        }
        // Now start the service with the new IP and port
        this.repeater = new SocketServer(this.repeaterIpAddress, this.repeaterPort, true);
        this.repeater.startSocket();
        this.repeaterIsRunning = true;
        // Set an interval to monitor the messages of the repeater class
        if (!this.messageCheckInterval) {
            this.messageCheckInterval = setInterval(function () { this.monitorRepeaterMessages() }.bind(this), 1000);
        }
    }
    // Method to stop the repeater service
    stopRepeaterSocket() {
        // Stop a running service
        if (this.repeaterIsRunning) {
            this.repeater.stopSocket();
        }
        // Destroy the object
        delete this.repeater;
        // Set running to false
        this.repeaterIsRunning = false;
    }

    monitorRepeaterMessages() {
        if (this.repeaterIsRunning === true) {
            // Go through the repeater class messages variable and emit them to the admin connection
            if (this.repeater.configMessages.length > 0) {
                let tempMessageArray = [...this.repeater.configMessages];
                this.repeater.configMessages = [];
                while (tempMessageArray.length > 0) {
                    let tempMessage = tempMessageArray.shift();
                    console.log('Sent message ', this.messageId, ' : ', tempMessage);
                    this.adminIo.emit('message', tempMessage);
                    this.messageId++;
                }
            }
        }
        return;
    }
}