/**
 * App.js
 * @author Tim Traver <timtraver@gmail.com>
 * @version 1.0
 * @see {@link http://github.com|GitHub}
 * @description : This code is to provide a central location for a Shot Clock coordinator between
 * an 'Admin' screen that is controlling the shot clock, and any overlays or screens that are
 * following a particular match.
 */

import React, { useEffect, useRef, useState } from 'react';
import logo from './assets/images/dp-logo-header.png';
import './App.css';
import './index.css';
import { Input, Space, Flex, Typography, Button } from 'antd';
import { Form, Select } from 'formik-antd';
import { Formik } from 'formik';
import qs from 'qs';
import { io } from 'socket.io-client';
import { CopyOutlined } from '@ant-design/icons';
import useToast from './useToast.js';

const { Text } = Typography;
const { Option } = Select;

export default function App() {
  // Front end app for electron version of the repeater application
  // Get initial props from querystring sent by electron base node
  const receivedQueryString = qs.parse(window.location.search, { ignoreQueryPrefix: true });
  const localInterfaces = JSON.parse(receivedQueryString.data);

  const [logMessages, setLogMessages] = useState('');
  const formRef = useRef();
  const [ipAddress, setIpAddress] = useState(localInterfaces[0].address);
  const [configPort, setConfigPort] = useState('8080');
  const [connectionURL, setConnectionURL] = useState(`http://${localInterfaces[0].address}:8080`);
  const [serviceRunning, setServiceRunning] = useState(false);
  const [restart, setRestart] = useState(false);
  const showToast = useToast();

  // Set initial connection object of admin server
  const [adminSocket, setAdminSocket] = useState(io('http://127.0.0.1:8000', { autoConnect: false }));

  // Update connectionURL string from the address and port so they have something to copy and paste
  useEffect(() => {
    setConnectionURL('http://' + ipAddress + ':' + configPort);
  }, [ipAddress, configPort]);

  // Connect to the admin socket just once
  useEffect(() => {
    if (adminSocket !== undefined) {
      console.log('opening the adminsocket');
      adminSocket.connect();
    }
  }, []);

  // Initialize the connection to the electron config admin socket
  useEffect(() => {
    if (restart === true) {
      // Send a restart commmand to the adminSocket to restart the repeater socket
      adminSocket.emit('start', {
        address: ipAddress,
        port: configPort
      });
      setLogMessages('');
      setRestart(false);
      setServiceRunning(true);
    }
  }, [restart]);

  useEffect(() => {
    console.log('Got into the message listener useEffect');
    if (adminSocket !== undefined) {
      console.log('Setting the message listener');
      adminSocket.on('message', (data) => {
        // Do some update of the clock differences and set the local vars to mimic the admin
        let date = new Date();
        console.log('Got message : ', data);
        let messageString = date.toLocaleString() + ' - ' + data + '\n';
        setLogMessages((oldString) => messageString + oldString);
      });
    }
  }, []);


  function handleIpAddress(e) {
    setIpAddress(e);
  }

  function handlePort(e) {
    setConfigPort(e.target.value);
  }

  function restartServices() {
    setRestart(true);
    return;
  }

  function handleClearMessages() {
    setLogMessages('');
  }

  return (
    <React.Fragment>
      <div className="vertical">
        <div className="logo">
          <img src={logo} width="400" className="App-logo" alt="logo" />
        </div>
        <div>
          <h2>Shot Clock Repeater Application</h2>
          <div>
            <div style={{ marginRight: 10 }}>
              <Formik
                id="settingsForm"
                enableReinitialize
                initialValues={{ ipAddress: ipAddress, configPort: configPort, connectionURL: '' }}
                innerRef={formRef}
              >
                {({ errors, touched, values }) => (
                  <React.Fragment>
                    <Form>
                      <table cellPadding="2">
                        <tbody>
                          <tr>
                            <th align="right">
                              <Text style={{ minwidth: 150, fontSize: 18, fontWeight: 600, color: "white" }}>
                                Local Interfaces
                              </Text>
                            </th>
                            <td>
                              <Select
                                name="ipAddress"
                                style={{ minWidth: 400, color: 'black' }}
                                placeholder="Select Network Interface"
                                size="medium"
                                onChange={handleIpAddress}
                              >
                                {localInterfaces.map((item, key) => (
                                  <Option value={item.address} key={key}>
                                    Interface {item.interface} - {item.address}
                                  </Option>
                                ))}
                              </Select>
                            </td>
                          </tr>
                          <tr>
                            <th align="right">
                              <Text style={{ minWidth: 150, fontSize: 18, fontWeight: 600, color: "white" }}>
                                Port
                              </Text>
                            </th>
                            <td>
                              <Input
                                name="configPort"
                                size="medium"
                                type='string'
                                value={configPort}
                                style={{ minHeight: 14, fontSize: 14, fontWeight: 600, color: "black" }}
                                onChange={handlePort}
                              />
                            </td>
                          </tr>
                          <tr>
                            <th align="right">
                              <Text style={{ fontSize: 18, fontWeight: 600, color: "white" }}>
                                Configuration URL
                              </Text>
                            </th>
                            <td>
                              <Space.Compact style={{ width: '100%' }}>
                                <Input
                                  name="connectionURL"
                                  size="medium"
                                  width="80%"
                                  value={connectionURL}
                                  readOnly
                                  className='copyButton'
                                  style={{ minHeight: 14, fontSize: 14, fontWeight: 600, color: "black" }}
                                />
                                <Button type="primary">
                                  <CopyOutlined style={{
                                    fontSize: '20px',
                                    color: 'white'
                                  }}
                                    onClick={() => {
                                      navigator.clipboard.writeText(connectionURL);
                                      showToast.success(`Config URL copied to clipboard.`);
                                    }}
                                  />
                                </Button>

                              </Space.Compact>
                            </td>
                          </tr>
                          <tr>
                            <td></td>
                            <td>
                              <Text style={{ minwidth: 150, fontSize: 12, fontWeight: 500, color: "white" }}>
                                Copy this link into the DigitalPool Tournament Shot Clock Settings
                              </Text>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Form>
                  </React.Fragment>
                )}
              </Formik>
            </div>
            <div>
              <Text style={{ fontSize: 18, fontWeight: 600, color: "white" }}>
                Activity Messages
              </Text>
            </div>
            <div
              style={{
                height: 140,
                overflow: 'auto',
                padding: '0 0 0 0',
                border: '1px solid rgba(140, 140, 140, 0.35)',
              }}
            >
              <textarea
                style={{
                  overflowY: 'scroll',
                  display: 'flex',
                  flexDirection: 'column - reverse',
                  fontSize: 12
                }}
                rows='20'
                cols='110'
                value={logMessages}
                readOnly
              />
            </div>
            <div style={{ padding: 10 }}>
              <Flex gap="large" style={{ float: 'right' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleClearMessages}
                >
                  Clear Messages
                </Button>
                <Button
                  size="large"
                  type="primary"
                  danger={serviceRunning ? true : false}
                  style={{ width: 250, backgroundColor: serviceRunning ? 'red' : 'green' }}
                  onClick={() => {
                    restartServices();
                  }}
                >
                  {serviceRunning ? 'Restart Services' : 'Start Socket Services'}
                </Button>
              </Flex>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment >
  );
}
