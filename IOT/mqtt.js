// Creating and connecting with server

const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
const port = 5000;
const clients = {};


//publish messages to subscribers
function publish(topic, data, callback) {
    let message = {
        qos: 0,
        topic: topic,
        payload: data,
        retain: false,
    };
    let clientId = Object.keys(aedes.clients)[0];
    if (!clientId) {
        return "Device is not Connected!";
    }
    aedes.clients[clientId].publish(message, callback);
    aedes.publish(message, callback);
}


//subscriber publisher
function subscribe(topic, callback) {
    let flag = 0;
    aedes.subscribe(topic, function (packet, cb) {
        let payload = (packet.payload);
        payload = getTypes(payload, "string");
        //    console.log(payload);
        console.log(`subscribe to topic ${topic} successfully`);
        if (flag === 1) {
            track("demo", null);
            flag++;
        }
    })
}


/*
startServer()-creates server,publisher and subscriber for IOT device communication with authentication 
*/
function startServer() {
    aedes.authenticate = function (client, username, password, callback) {
        let authorized =
            username === "userTest" && //enter your username
            password.toString() === "password"; //enter your password
        if (authorized) {
            client.user = username;
        } else {
            let error = new Error("Authenticate error");
            error.returnCode = 1;
            return callback(error, null);
        }
        return callback(null, authorized);
    };
    aedes.authorizePublish = function (client, packet, callback) {
        let topic = packet.topic;
        let data = packet.payload.toString();
        clients['id'] = client.id;
        publish(topic, data, callback);
        return callback(null, 'success');
    }
    aedes.authorizeSubscribe = function (client, sub, callback) {
        clients['id'] = client.id;
        subscribe(sub.topic, callback);
        return callback(null, 'success')
    }
    server.listen(port, () => {
        console.log("Server is Listening on Port:", port);
    });
}

startServer();


// Convert your payload from format of command to string and string to format of commands

const DATA_TYPES = {
    STRING: 'string',
    BINARY: 'binary',
    OCTAL: 'octal',
    DECIMAL: 'decimal',
    HEXADECIMAL: 'hexaDecimal',
};

//Convert your payload in string
function getTypes(payload, types) {
    let bufferData;
    if (/[0-9A-Fa-f]{6}/g.test(payload) && types === DATA_TYPES.HEXADECIMAL) {
        types = DATA_TYPES.HEXADECIMAL;
        payload = Buffer.from(payload, 'hexa').toString();
        bufferData = types_to_ascii(payload, 16);
    }
    else if (/[0-7]{3}/g.test(payload) && types === DATA_TYPES.OCTAL) {
        types = DATA_TYPES.OCTAL;
        payload = Buffer.from(payload, 'base64').toString();
        bufferData = types_to_ascii(payload, 8);
    }
    else if (/[0,1]/g.test(payload) && types === DATA_TYPES.BINARY) {
        types = DATA_TYPES.BINARY;
        payload = Buffer.from(payload, 'binary').toString();
        bufferData = types_to_ascii(payload, 2);
    }
    else if (/[0-9]/g.test(payload) && types === DATA_TYPES.DECIMAL) {
        types = DATA_TYPES.DECIMAL;
        payload = Buffer.from(payload, 'readInt16LE').toString();
        bufferData = types_to_ascii(payload, 10);
    }
    else if (types === DATA_TYPES.STRING) {
        types = DATA_TYPES.STRING;
        bufferData = payload.toString();
    }
    bufferData = bufferData ? bufferData : payload;
    return bufferData;
}
function types_to_ascii(payload, base) {

    let str = '';
    if (base === 16) {
        let hex = payload.toString();
        for (let n = 0; n < hex.length; n += 2) {
            str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
        }
    } else if (base === 2 || base === 8 || base === 10) {
        str = payload.split(' ')
            .map(bin => String.fromCharCode(parseInt(bin, base)))
            .join('');
    }

    return str;

}
function textToBin(text, base) {
    let payload;
    if (base === 2) {
        payload = Array
            .from(text)
            .reduce((acc, char) => acc.concat(char.charCodeAt().toString(2)), [])
            .map(bin => '0'.repeat(8 - bin.length) + bin)
            .join(' ');
    } else if (base === 8 || base === 10 || base === 16) {
        payload = Array
            .from(text)
            .reduce((acc, char) => acc.concat(char.charCodeAt().toString(base)), [])
            .join(' ');
    }
    return payload;
}

//Convert string to respective payload and its types
function setTypes(payload, types) {
    let bufferData = '';
    if (types === DATA_TYPES.BINARY) {
        bufferData = textToBin(payload, 2);
    } else if (types === DATA_TYPES.OCTAL) {
        bufferData = textToBin(payload, 8);
    } else if (types === DATA_TYPES.DECIMAL) {
        bufferData = textToBin(payload, 10);
    } else if (types === DATA_TYPES.HEXADECIMAL) {
        bufferData = textToBin(payload, 16);
    } else if (types === DATA_TYPES.STRING) {
        bufferData = payload;
    }
    return bufferData;

}


//Other IOT commands

function commandToSend(topic, command, callback, maxTry = 3) {
    let tried = 1;
    if (maxTry > tried) {
        subscribe(topic, callback);
        //put your business logic here
        publish(topic, command, callback);
        tried = tried + 1;
    }
}
//track device
function track(topic, callback) {
    let command = "command for track device"
//add command for track device
    commandToSend(topic, command, callback);
}
//device on
function on(topic, callback) {
    let command = "command for on device";
    commandToSend(topic, command, callback); //add command for on device
}
//device off
function off(topic, callback) {
    let command = "command for off device";
    commandToSend(topic, command, callback); //add command for on device
}