// checksum generate
// checksum.js
"use strict";

var crypto = require("crypto");

class PaytmChecksum {
  static encrypt(input, key) {
    var cipher = crypto.createCipheriv("AES-128-CBC", key, PaytmChecksum.iv);
    var encrypted = cipher.update(input, "binary", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  }
  static decrypt(encrypted, key) {
    var decipher = crypto.createDecipheriv(
      "AES-128-CBC",
      key,
      PaytmChecksum.iv
    );
    var decrypted = decipher.update(encrypted, "base64", "bnary");
    try {
      decrypted += decipher.final("binary");
    } catch (e) {
      console.log(e);
    }
    return decrypted;
  }
  static generateSignature(params, key) {
    if (typeof params !== "object" && typeof params !== "string") {
      var error = "string or object expected, " + typeof params + " given.";
      return Promise.reject(error);
    }
    if (typeof params !== "string") {
      params = PaytmChecksum.getStringByParams(params);
    }
    return PaytmChecksum.generateSignatureByString(params, key);
  }

  static verifySignature(params, key, checksum) {
    if (typeof params !== "object" && typeof params !== "string") {
      var error = "string or object expected, " + typeof params + " given.";
      return Promise.reject(error);
    }
    if (params.hasOwnProperty("CHECKSUMHASH")) {
      delete params.CHECKSUMHASH;
    }
    if (typeof params !== "string") {
      params = PaytmChecksum.getStringByParams(params);
    }
    return PaytmChecksum.verifySignatureByString(params, key, checksum);
  }

  static async generateSignatureByString(params, key) {
    var salt = await PaytmChecksum.generateRandomString(4);
    return PaytmChecksum.calculateChecksum(params, key, salt);
  }

  static verifySignatureByString(params, key, checksum) {
    var paytm_hash = PaytmChecksum.decrypt(checksum, key);
    var salt = paytm_hash.substr(paytm_hash.length - 4);
    return paytm_hash === PaytmChecksum.calculateHash(params, salt);
  }

  static generateRandomString(length) {
    return new Promise(function (resolve, reject) {
      crypto.randomBytes((length * 3.0) / 4.0, function (err, buf) {
        if (!err) {
          var salt = buf.toString("base64");
          resolve(salt);
        } else {
          console.log("error occurred in generateRandomString: " + err);
          reject(err);
        }
      });
    });
  }

  static getStringByParams(params) {
    var data = {};
    Object.keys(params)
      .sort()
      .forEach(function (key, value) {
        data[key] =
          params[key] !== null && params[key].toLowerCase() !== "null"
            ? params[key]
            : "";
      });
    return Object.values(data).join("|");
  }

  static calculateHash(params, salt) {
    var finalString = params + "|" + salt;
    return crypto.createHash("sha256").update(finalString).digest("hex") + salt;
  }
  static calculateChecksum(params, key, salt) {
    var hashString = PaytmChecksum.calculateHash(params, salt);
    return PaytmChecksum.encrypt(hashString, key);
  }
}
PaytmChecksum.iv = "@@@@&&&&####$$$$";
module.exports = PaytmChecksum;



/* ------------------------------------------------------ */
// payment generate
app.post("/payment", (req, res) => {
    // Route for making payment
    try {
      const orderId = "TEST_" + new Date().getTime();
      let data = req.body;
  
      const paytmParams = {};
  
      paytmParams.body = {
        requestType: "Payment",
        mid: PaytmConfig.mid,
        websiteName: PaytmConfig.website,
        orderId: orderId,
        callbackUrl: "http://localhost:3000/callback",
        txnAmount: {
          value: data.amount,
          currency: "INR",
        },
        userInfo: { custId: data.email },
      };
  
      PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        PaytmConfig.key
      ).then(function (checksum) {
        paytmParams.head = { signature: checksum };
  
        var post_data = JSON.stringify(paytmParams);
  
        var options = {
          /* for Staging */
          hostname: "securegw-stage.paytm.in",
  
          /* for Production */
          // hostname: 'securegw.paytm.in',
  
          port: 443,
          path: `/theia/api/v1/initiateTransaction?mid=${PaytmConfig.mid}&orderId=${orderId}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": post_data.length,
          },
        };
  
        var response = "";
        var post_req = https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });
  
          post_res.on("end", function () {
            response = JSON.parse(response);
  
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(`<html>
                                  <head>
                                      <title>Show Payment Page</title>
                                  </head>
                                  <body>
                                      <center>
                                          <h1>Please do not refresh this page...</h1>
                                      </center>
                                      <form method="post" action="https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid=${PaytmConfig.mid}&orderId=${orderId}" name="paytm">
                                          <table border="1">
                                              <tbody>
                                                  <input type="hidden" name="mid" value="${PaytmConfig.mid}">
                                                      <input type="hidden" name="orderId" value="${orderId}">
                                                      <input type="hidden" name="txnToken" value="${response.body.txnToken}">
                                           </tbody>
                                        </table>
                                                      <script type="text/javascript"> document.paytm.submit(); </script>
                                     </form>
                                  </body>
                               </html>`);
            res.end();
          });
        });
  
        post_req.write(post_data);
        post_req.end();
      });
    } catch (error) {
      console.log(error.message);
    }
  });



// Payment callback
app.post("/callback", (req, res) => {
    // Route for verifying payment
    try {
      let data = JSON.parse(JSON.stringify(req.body));
  
      const paytmChecksum = data.CHECKSUMHASH;
  
      var isVerifySignature = PaytmChecksum.verifySignature(
        data,
        PaytmConfig.key,
        paytmChecksum
      );
      if (isVerifySignature) {
        console.log("Checksum Matched");
  
        var paytmParams = {};
  
        paytmParams.body = {
          mid: PaytmConfig.mid,
          orderId: data.ORDERID,
        };
  
        PaytmChecksum.generateSignature(
          JSON.stringify(paytmParams.body),
          PaytmConfig.key
        ).then(function (checksum) {
          paytmParams.head = { signature: checksum };
  
          var post_data = JSON.stringify(paytmParams);
  
          var options = {
            /* for Staging */
            hostname: "securegw-stage.paytm.in",
  
            /* for Production */
            // hostname: 'securegw.paytm.in',
  
            port: 443,
            path: "/v3/order/status",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": post_data.length,
            },
          };
  
          // Set up the request
          var response = "";
          var post_req = https.request(options, function (post_res) {
            post_res.on("data", function (chunk) {
              response += chunk;
            });
  
            post_res.on("end", function () {
              res.write(response);
              res.end();
            });
          });
  
          // post the data
          post_req.write(post_data);
          post_req.end();
        });
      } else {
        console.log("Checksum Mismatched");
      }
    } catch (error) {
      console.log(error.message);
    }
  });