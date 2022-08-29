// payment create 

const paypal = require("paypal-rest-sdk");
paypal.configure({
  mode: "sandbox", // update mode to 'live' for live transactions
  client_id: "####yourClientId####",
  client_secret: "####yourClientSecret###",
});

app.post("/pay", (req, res) => {
  try {
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      // callbacks
      redirect_urls: {
        return_url: "http://localhost:3000/success", // success URL,
        cancel_url: "http://localhost:3000/cancel", // Cancle URL
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "Nike Shoes",
                sku: "001",
                price: "25.00",
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: "25.00",
          },
          description: "Shoes",
        },
      ],
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }
        }
      }
    });
  } catch (error) {
    res.send(error.message);
  }
});


//payment success
app.get("/success", (req, res) => {
    try {
      const payerId = req.query.PayerID;
      const paymentId = req.query.paymentId;
  
      const execute_payment_json = {
        payer_id: payerId,
        transactions: [
          {
            amount: {
              currency: "USD",
              total: "25.00",
            },
          },
        ],
      };
  
      // Obtains the transaction details from paypal
      paypal.payment.execute(
        paymentId,
        execute_payment_json,
        function (error, payment) {
          //When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.
          if (error) {
            //console.log(error.response);
            throw error;
          } else {
            //console.log(JSON.stringify(payment));
            res.send("Success");
          }
        }
      );
    } catch (error) {
      res.send(error.message);
    }
  });