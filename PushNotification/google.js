let admin = require("firebase-admin");

module.exports = {
  async sendNotification(data) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.GOOGLE_PROJECTID,
        clientEmail: process.env.GOOGLE_CLIENTEMAIL,
        privateKey: process.env.GOOGLE_PRIVATEKEY,
      }),
      databaseURL: process.env.GOOGLE_DATABASEURL,
    });
    let registrationToken = data.deviceId;

    let payload = {
      data: {
        MyKey: data.message,
      },
    };
    let options = {
      priority: "high",
      timeToLive: 60 * 60 * 24,
    };
    admin
      .messaging()
      .sendToDevice(registrationToken, payload, options)
      .then(function (response) {
        console.log("successfully send message", response);
      })
      .catch(function (error) {
        console.log("error sending message", error);
      });
  },
};