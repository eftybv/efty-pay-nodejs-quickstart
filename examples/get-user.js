const grpc = require('@grpc/grpc-js');
const {
    UsersClient,
    Id,
    GetObjectRequest,
} = require('efty-pay-nodejs-sdk');
const { generateToken } = require('./helpers');
require('dotenv').config();

(async () => {
    try {
        const apiUrl = process.env.EFTY_PAY_API_URL;
        const userIdValue = '4VlIPczrBspb83omByVH32'; // Replace with actual user ID

        const metadata = new grpc.Metadata();
        metadata.add('authorization', generateToken());

        const usersClient = new UsersClient(apiUrl, grpc.credentials.createSsl());

        // Get user by ID
        const userIdRequest = new Id();
        userIdRequest.setId(userIdValue);

        const userById = await new Promise((resolve, reject) => {
            usersClient.getUserById(userIdRequest, metadata, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

        console.log('User details (by ID):');
        console.log('Id:', userById.getId());
        console.log('Username:', userById.getUsername());
        console.log('Email:', userById.getEmail());

        // Get user by email
        const getObjectRequest = new GetObjectRequest();
        getObjectRequest.setFieldvalue(userById.getEmail());

        const userByEmail = await new Promise((resolve, reject) => {
            usersClient.getUserByEmail(getObjectRequest, metadata, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

        console.log('\nUser details (by Email):');
        console.log('Id:', userByEmail.getId());
        console.log('Username:', userByEmail.getUsername());
        console.log('Email:', userByEmail.getEmail());
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
