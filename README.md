# Stripe to Xero

Stripe to Xero is an AWS Lambda function to import Stripe transactions into Xero. It is built with the [Serverless](https://serverless.com) framework. It acts as a webhook that Stripe POSTs to. Once deployed, you can set the URL as a webhook in the Stripe dashboard. It will only respond to `charge.succeeded` and `transfer.paid` events.

### Deploying

To deploy, run the Serverless command:

```bash
serverless deploy
```

### Testing

You can run the function locally to test its function. First you'll need all of the required API keys. Next, download the webhook JSON payload from the Stripe dashboard. Once you have everything set up, run the test and feed the JSON payload into the function.

```bash
serverless invoke local --function stripeImporter --path webhooks/transfer.paid.json
```

### Environment Setup

The function requires API keys for both Stripe and Xero as well as some information about Xero accounts. These keys are stored in separate `secret.{ENV}.yml` files, which are then gitignored. See `secrets.example.yml` for everything needed. Fill in the secrets and then rename the file.
