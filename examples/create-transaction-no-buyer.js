const grpc = require('@grpc/grpc-js');
const {
    TransactionsClient,
    TransactionRequest,
    Transaction,
    DigitalAsset,
    AssetType,
    UtmParameters,
    Currency,
} = require('efty-pay-nodejs-sdk');
const {
    User,
} = require('efty-pay-nodejs-sdk');
const {
    Domain,
} = require('efty-pay-nodejs-sdk');
const { generateToken, generateRandomString } = require('./helpers');
require('dotenv').config();

(async () => {
    try {
        const apiUrl = process.env.EFTY_PAY_API_URL;
        const randomString = generateRandomString(5);
        const sellerUserId = '4VlIPczrBspb83omByVH32'; // Replace with actual user ID

        const metadata = new grpc.Metadata();
        metadata.add('authorization', generateToken());

        const transactionsClient = new TransactionsClient(apiUrl, grpc.credentials.createSsl());

        // Define the seller
        const seller = new User();
        seller.setId(sellerUserId);

        // Define domain asset
        const domain = new Domain();
        domain.setDomainname(`efty${randomString}.com`);

        const digitalAsset = new DigitalAsset();
        digitalAsset.setDomain(domain);

        // Define UTM parameters
        const utmParams = new UtmParameters();
        utmParams.setUtmsource('utm-source');
        utmParams.setUtmcampaign('utm-campaign');
        utmParams.setUtmterm('utm-term');
        utmParams.setUtmcontent('utm-content');
        utmParams.setUtmmedium('utm-medium');

        // Build transaction
        const transaction = new Transaction();
        transaction.setSeller(seller);
        transaction.setAssettype(AssetType.DOMAIN_NAME);
        transaction.setDigitalasset(digitalAsset);
        transaction.setUtmparameters(utmParams);
        transaction.setCurrency(Currency.USD);
        transaction.setAssetamountexcvat(100000); // $1,000.00

        const transactionRequest = new TransactionRequest();
        transactionRequest.setTransaction(transaction);

        // Create transaction
        const newTransaction = await new Promise((resolve, reject) => {
            transactionsClient.createTransaction(transactionRequest, metadata, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

        console.log('New transaction created:', newTransaction.getId());
        console.log('Transaction checkout URL:', newTransaction.getCheckoutdetails().getCheckouturl());
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
