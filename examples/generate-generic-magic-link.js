const grpc = require('@grpc/grpc-js');
const { PaymentsClient, Id } = require('efty-pay-nodejs-sdk');
const { generateToken } = require('./helpers');
require('dotenv').config();

(async () => {
    try {
        // Get the API URL
        const apiUrl = process.env.EFTY_PAY_API_URL;

        // Replace with your actual seller ID (likely from a previous transaction)
        const sellerIdValue = '4VlIPczrBspb83omByVH32';

        const metadata = new grpc.Metadata();
        metadata.add('authorization', generateToken());

        // Create gRPC client
        const paymentsClient = new PaymentsClient(apiUrl, grpc.credentials.createSsl());

        // Create the Id message for the seller
        const sellerId = new Id();
        sellerId.setId(sellerIdValue);

        // Request the generic magic link
        const magicLinkResponse = await new Promise((resolve, reject) => {
            paymentsClient.getGenericMagicLink(sellerId, metadata, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

        console.log('Magic link:', magicLinkResponse.getValue());
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
