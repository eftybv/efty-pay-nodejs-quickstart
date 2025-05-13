const grpc = require('@grpc/grpc-js');
const {
    TransactionsClient,
    TransactionRequest,
    Transaction,
    DigitalAsset,
    UtmParameters,
    AssetType,
    Currency,
    TransactionParty,
    Domain,
} = require('efty-pay-nodejs-sdk');
const {
    User,
    UserType,
    UserStatus,
    Address,
    VatSettings,
    CountryCode
} = require('efty-pay-nodejs-sdk');
const {
    PaymentDetails,
    MangopayDetails,
    UserCategory,
} = require('efty-pay-nodejs-sdk');
const { generateToken, generateRandomString } = require('./helpers');
require('dotenv').config();

(async () => {
    try {
        const apiUrl = process.env.EFTY_PAY_API_URL;
        const randomString = generateRandomString(5);
        const sellerUserId = '4VlIPczrBspb83omByVH32'; // Replace with actual seller ID

        const metadata = new grpc.Metadata();
        metadata.add('authorization', generateToken());

        const transactionsClient = new TransactionsClient(apiUrl, grpc.credentials.createSsl());

        // Buyer details
        const buyer = new User();
        buyer.setFirstname('Patrick');
        buyer.setLastname('Kosterman');
        buyer.setUsername(`patrick-kosterman-buyer-${randomString}`);
        buyer.setEmail(`patrick-kosterman-buyer-${randomString}@efty.com`);
        buyer.setPassword('wasdfp-0wsdfe-mafdfrw');
        buyer.setCompanyregistrationnumber('87654321');
        buyer.setCompanyname('Efty Pay B.V.');

        const address = new Address();
        address.setAddressline1('Zuiderpark 17');
        address.setPostalcode('9724 AG');
        address.setCity('Groningen');
        address.setCountry(CountryCode.NL);

        buyer.setCompanyaddress(address);

        const vatSettings = new VatSettings();
        vatSettings.setHasvat(true);
        buyer.setVatsettings(vatSettings);

        buyer.setUsertype(UserType.BUYER_OR_SELLER);
        buyer.setStatus(UserStatus.ACTIVE);
        buyer.setPhonenumber('+34615504467');

        const mangopayDetails = new MangopayDetails();
        mangopayDetails.setOnboardassellerwithmangopay(false);
        mangopayDetails.setUsercategory(UserCategory.PAYER);

        const paymentDetails = new PaymentDetails();
        paymentDetails.setMangopaydetails(mangopayDetails);
        buyer.setPaymentdetails(paymentDetails);

        // Transaction object
        const transaction = new Transaction();
        const seller = new User();
        seller.setId(sellerUserId);
        transaction.setSeller(seller);
        transaction.setBuyer(buyer);
        transaction.setAssettype(AssetType.DOMAIN_NAME);

        const domain = new Domain();
        domain.setDomainname(`efty${randomString}.com`);

        const digitalAsset = new DigitalAsset();
        digitalAsset.setDomain(domain);
        transaction.setDigitalasset(digitalAsset);

        const utm = new UtmParameters();
        utm.setUtmcampaign('utm-campaign');
        utm.setUtmsource('utm-source');
        utm.setUtmterm('utm-term');
        utm.setUtmmedium('utm-medium');
        utm.setUtmcontent('utm-content');
        transaction.setUtmparameters(utm);

        transaction.setCurrency(Currency.USD);
        transaction.setAssetamountexcvat(100000); // 1000.00 USD

        // Optional: seller initiated
        transaction.setInitiatedby(TransactionParty.SELLER);

        const transactionRequest = new TransactionRequest();
        transactionRequest.setTransaction(transaction);

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
