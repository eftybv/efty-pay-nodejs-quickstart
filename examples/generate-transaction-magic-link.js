const grpc = require('@grpc/grpc-js');
const {
    TransactionsClient,
    TransactionMagicLinkPayload
} = require('efty-pay-nodejs-sdk');
const { generateToken } = require('./helpers');
require('dotenv').config();

(async () => {
    try {
        // Get the API URL
        const apiUrl = process.env.EFTY_PAY_API_URL;

        // Replace with your actual transaction ID
        const transactionId = '1IOefXThiDx5OV6YGAwrs8';

        const metadata = new grpc.Metadata();
        metadata.add('authorization', generateToken());

        // Create gRPC client for Transactions
        const transactionsClient = new TransactionsClient(apiUrl, grpc.credentials.createSsl());

        // Build the request payload
        const magicLinkRequest = new TransactionMagicLinkPayload();
        magicLinkRequest.setTransactionid(transactionId);
        magicLinkRequest.setSendtoseller(false); // Set true to email seller
        magicLinkRequest.setSendtobuyer(false);  // Set true to email buyer

        // Call the gRPC method
        const magicLinkResponse = await new Promise((resolve, reject) => {
            transactionsClient.sendTransactionMagicLinkEmail(magicLinkRequest, metadata, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

        console.log('Seller link:', magicLinkResponse.getSellerlink());
        console.log('Buyer link:', magicLinkResponse.getBuyerlink());
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
