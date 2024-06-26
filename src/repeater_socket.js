/**
 * repeater_socket.js
 * @author Tim Traver <timtraver@gmail.com>
 * @version 1.0
 * @see {@link http://github.com|GitHub}
 * @description : This code is to provide a central location for a Shot Clock coordinator between
 * an 'Admin' screen that is controlling the shot clock, and any overlays or screens that are
 * following a particular match.
 */

import express from 'express';
import { createServer } from 'node:https';
import { Server } from 'socket.io';
import fs from 'fs';
export default class SocketServer {
    address;
    port;
    hasConfigServer = false;
    httpsKeyPath;
    httpsCertPath;
    app;
    server;
    io;
    rooms = [];
    configMessages = [];

    // Constructor to set the ip address and port
    constructor(address, port, hasConfigServer, httpsKeyPath, httpsCertPath) {
        this.address = address;
        this.port = port;
        this.hasConfigServer = hasConfigServer;
        this.httpsKeyPath = httpsKeyPath;
        this.httpsCertPath = httpsCertPath;

        const privateKey = fs.readFileSync(this.httpsKeyPath, 'utf8');
        const certificate = fs.readFileSync(this.httpsCertPath, 'utf8');
        const credentials = { key: privateKey, cert: certificate };

        this.app = express();
        this.server = createServer(credentials, this.app);
        this.io = new Server(this.server, { cors: { origin: "*" } });
    }

    shortenSocketString(string) {
        return string.substring(string.length - 5);
    }

    // Method to start the socket services
    startSocket() {

        // Set the events for the server connections
        this.io.on('connection', (socket) => {
            console.log('Client connected : ', socket.id);
            if (this.hasConfigServer) this.sendConfigMessage(this.shortenSocketString(socket.id) + ' - Connected');

            // Listen for pings that are used to determine clock differences
            socket.on('ping', (data, callback) => {
                callback({
                    sentServerTime: Date.now()
                });
            });

            socket.on('join', (data, callback) => {
                let roomName = 'match' + data.match.toString();
                let type = data.type;
                let returnData = {};

                this.sendConfigMessage(this.shortenSocketString(socket.id) + ' - Joining match ' + data.match + ' as ' + type);
                console.log("rooms = ", this.rooms);
                if (this.rooms[roomName] == undefined) {
                    // Room does not yet exist, so lets create it
                    if (type == 'admin') data.admin = socket.id;
                    delete data.type;
                    this.rooms[roomName] = data;
                    socket.join(roomName);
                } else {
                    // Room already exists, so update the admin if it is an admin join
                    if (type == 'admin') this.rooms[roomName].admin = socket.id;
                    socket.join(roomName);
                    returnData = this.rooms[roomName];
                }
                const connectionsInRoom = this.io.sockets.adapter.rooms.get(roomName).size;
                this.sendConfigMessage('Room ' + roomName + ' (' + `${connectionsInRoom}` + ')');
                callback(
                    returnData
                );
            });

            socket.on('update', (data, callback) => {
                let roomName = 'match' + data.match.toString();
                let room = this.rooms[roomName];
                this.rooms[roomName] = { ...room, ...data };
                console.log('update data sent : ', data);
                console.log('room data : ', this.rooms);

                // Do some calculations for the time diffs and then send an emit to the members in the room
                this.ensureEmit(socket, roomName, 'update', {
                    ...data,
                    isPlaying: data.isPlaying,
                    endTimerTime: data.endTimerTime + data.clockOffset,
                    remainingTime: data.remainingTime,
                    maxTime: data.maxTime,
                    updateKey: data.updateKey
                });
                callback({
                    status: "ok"
                });
                this.sendConfigMessage(this.shortenSocketString(socket.id) + ' - Room ' + roomName + ' - Update - Remaining : ' + data.remainingTime + ', Playing : ' + data.isPlaying);
            });

            socket.on('disconnect', () => {
                this.sendConfigMessage(this.shortenSocketString(socket.id) + ' - Client disconnected');
                this.cleanRooms(socket);
            });
        });

        this.io.listen(this.server);
        this.server.listen(this.port, this.address, () => {
            this.sendConfigMessage('Server started and listening at https://' + this.address + ':' + this.port);
        });
    }

    ensureEmit(socket, roomName, event, arg, attempt = 0) {
        this.sendConfigMessage("Sending emit to room " + roomName);
        let retries = 3; // Number of retries before giving up
        attempt++;
        if (attempt < retries) {
            socket.timeout(2000).to(roomName).emit(event, arg, (err, responses) => {
                if (err) {
                    this.sendConfigMessage("Got Error From Emit: ", err);
                    // no ack from the client, so try and send it again
                    this.ensureEmit(socket, roomName, event, arg, attempt);
                } else {
                    this.sendConfigMessage('Emit Success');
                }
            });
        } else {
            this.sendConfigMessage('Failed to send emit to room ' + roomName + ' after ' + retries + ' attempts.');
        }
    }

    stopSocket() {
        // Stop the socket server and clear the variables
        // make all Socket instances disconnect
        this.io.disconnectSockets();
        this.io.close();
        this.sendConfigMessage('Socket server services stopped.');
        return;
    }

    cleanRooms(socket) {
        // Check to see if we need to clear the room data, so we don't build up huge arrays of byegone match rooms
        // console.log('IO Room Data : ', this.io.sockets.adapter.rooms);
        for (const key in this.rooms) {
            if (!this.io.sockets.adapter.rooms.has(key)) {
                // The room no longer has anyone in it, so lets remove that element from the rooms array
                // logMessage('Match ' + key + ' empty, so removing local data.');
                delete this.rooms[key];
            } else {
                //check if the disconnected client was an admin, and take the admin key out of the saved room
                if (this.rooms[key].admin == socket.id) {
                    this.rooms[key].admin = '';
                }
            }
        }
    }

    sendConfigMessage(message) {
        if (this.hasConfigServer === true) {
            this.configMessages.push(message);
        } else {
            let date = new Date;
            console.log(date.toLocaleDateString() + ' - ' + message);
        }
    }
}