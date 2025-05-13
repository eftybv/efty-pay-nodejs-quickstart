// examples/createTransaction.js
const grpc = require('@grpc/grpc-js');
const { generateToken } = require('./helpers');
const { Id, TransactionsClient } = require('efty-pay-nodejs-sdk');
require('dotenv').config();

console.log('Getting transaction...');

// Create gRPC client
const client = new TransactionsClient(
    process.env.EFTY_PAY_API_URL,
    grpc.credentials.createSsl()
);

// Prepare metadata with JWT token
const metadata = new grpc.Metadata();
metadata.add('Authorization', generateToken());

console.log(metadata);

// Create an Id object
const transactionId = new Id();
transactionId.setId('1IOefXThiDx5OV6YGAwrs8');

// Call getTransaction
client.getTransactionById(transactionId, metadata, (err, response) => {
    if (err) {
        console.error('Error fetching transaction:', err);
    } else {
        console.log('Transaction details:', response.toObject());
    }
});