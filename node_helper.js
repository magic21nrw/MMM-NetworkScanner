/* global require, module */
/* Magic Mirror
 * Node Helper: MMM-NetworkScanner
 *
 * By Ian Perrin http://ianperrin.com
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const ping = require('ping')
const sudo = require("sudo");


module.exports = NodeHelper.create({
    start: function function_name () {
        console.log("Starting module: " + this.name);
    },

    // Override socketNotificationReceived method.
    socketNotificationReceived: function(notification, payload) {
        console.log(this.name + ' received ' + notification);

        if (notification === "SCAN_NETWORK") {
            this.devices = payload;
            this.scanNetworkMAC();
            this.scanNetworkIP(payload);
            return true;
        }

//        if (notification === "TEST") {
//         console.log("Recived a test notification with the following payload:");
//         console.log(payload);
//        }
    },

    scanNetworkMAC: function() {
        console.log(this.name + " is scanning for mac addresses");

        var self = this;
        var arp = sudo(['arp-scan', '-l', '-q']);
        var buffer = '';
        var errstream = '';

        arp.stdout.on('data', function (data) {
            buffer += data;
        });

        arp.stderr.on('data', function (data) {
            errstream += data;
        });

        arp.on('error', function (err) {
            errstream += err;
        });

        arp.on('close', function (code) {
            if (code !== 0) {
                console.log(self.name + " received an error running arp-scan: " + code + " - " + errstream);
                return;
            }
            //Parse the response
            var rows = buffer.split('\n');
            var macAddresses = [];

            // ARP-SCAN table
            for (var i = 2; i < rows.length; i++) {
                var cells = rows[i].split('\t').filter(String);
                if (cells[1] && macAddresses.indexOf(cells[1].toUpperCase()) === -1) {
                    macAddresses.push(cells[1].toUpperCase());
                }
            }

//            console.log("MAC_ADDRESSES", macAddresses);

            self.sendSocketNotification('MAC_ADDRESSES', macAddresses);
        });



    },

   scanNetworkIP: function(payload) {
      var self = this;
      console.log(this.name + " is scanning for ip addresses");

      console.log("Recived payload: ",payload); 

      var devices = payload;
      var deviceList = [];

      function updateIPAddresses(devices) {
         devices.forEach( function(device) {
            if ("ipAddress" in device) {
               ping.sys.probe(device.ipAddress, function(isAlive) {
                  var deviceStatus = {name: device.name, online:isAlive};
//                  console.log(deviceStatus);
                  deviceList.push(deviceStatus);
                  self.sendSocketNotification("IP_ADDRESS", deviceStatus);
               });
            };
         });
      }

//      function printDevices(deviceList) {
//         console.log("deviceList: ",deviceList); 
//      };

      updateIPAddresses(devices);
   
//         callback(deviceList);

      
   },
});
