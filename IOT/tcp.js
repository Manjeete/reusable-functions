// Creating and connecting with server
const net = require('net');
const server = net.createServer(); //Creating server

//Connecting with server
server.on('connection', function (socket) {
    let remoteAddress = `${socket.remoteAddress},${socket.remotePort}`
    console.log(remoteAddress);

    //Receiving and Sending payload from/to client
    socket.on('data', function (payload) {
        payload = getTypes(payload, 'string');
        payload = setTypes(payload, 'string');
        socket.write(`acknowledge : ${payload}`);
        switch (true) {
            case payload.includes('track'):
                track(payload, socket);
                break;
        }
    });
    //Close connection
    socket.on('close', function () {
        console.log('Server Connection Closed');
    });
    //Server error
    socket.on('error', function (err) {
        console.log(err);
    });
});

server.listen(7000, function () {
    console.log('Server Listing on Port 7000');
})


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


// other IOT commands
function commandToSend(payload, command, socket, maxTry = 3) {
    let tried = 1;
    if (maxTry > tried) {
        socket.write(`${command},success`);
        tried = tried + 1;
    }
}
//track device
function track(topic, socket) {
    let command = "command for track device"
//add command for track device 
    commandToSend(topic, command, socket);
}
//device on
function on(topic) {
    let command = "command for on device"; //add command for on device
    commandToSend(topic, command);
}
//device off
function off(topic) {
    let command = "command for off device"; //add command for on device
    commandToSend(topic, command);
}