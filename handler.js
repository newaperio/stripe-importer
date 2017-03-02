const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const Xero = require('xero');

const xeroPrivateKey = fs.readFileSync("./xero_keys/privatekey.pem");
const xero = new Xero(
  process.env.XERO_CONSUMER_KEY,
  process.env.XERO_CONSUMER_SECRET,
  xeroPrivateKey
)

function handleCharge(data) {
  customer = stripe.customers.retrieve(data.object.customer,
    function(err, customer) {
      var transactions = [
        {
          Type: "RECEIVE",
          Reference: data.object.id,
          BankAccount: {
            Code: process.env.XERO_STRIPE_ACCOUNT_CODE,
          },
          Contact: {
            Name: customer == undefined ?
              data.object.source.name : customer.description,
          },
          LineItems: [
            {
              Description: data.object.description == undefined ?
                customer.description : data.object.description,
              UnitAmount: (data.object.amount / 100),
              AccountCode: process.env.XERO_SALES_ACCOUNT_CODE,
            },
          ],
        },
        {
          Type: "Spend",
          Reference: data.object.id,
          BankAccount: {
            Code: process.env.XERO_STRIPE_ACCOUNT_CODE,
          },
          Contact: {
            Name: "Stripe",
          },
          LineItems: [
            {
              Description: data.object.fee_details[0].description,
              UnitAmount: data.object.fee / 100,
              AccountCode: process.env.XERO_STRIPE_FEE_ACCOUNT_CODE,
            },
          ],
        }
      ];

      xero.call('POST', '/BankTransactions', transactions, function(err, json) {
        if (err) {
          console.log(err);
        }
      });
    }
  );
}

function handleTransfer(data) {
  var transfer = [{
    FromBankAccount: {
      Code: process.env.XERO_STRIPE_ACCOUNT_CODE,
    },
    ToBankAccount: {
      Code: process.env.XERO_STRIPE_TRANSFER_ACCOUNT_CODE,
    },
    Amount: (data.object.amount / 100),
  }];

  xero.call('POST', '/BankTransfers', transfer, function(err, json) {
    if (err) {
      console.log(err);
    }
  });
}

module.exports.stripeImporter = (event, context, callback) => {
  stripe.events.retrieve(event.id, function(err, event) {
    if (err) {
      console.log(err);
      callback(new Error('Invalid Stripe event sent.'));
      return;
    }

    switch (event.type) {
    case "charge.succeeded":
      handleCharge(event.data);
      break;
    case "transfer.paid":
      handleTransfer(event.data);
      break;
    default:
      break;
    }

    callback(null, { statusCode: 200 });
  });
};
