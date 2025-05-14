# Efty Pay Node.js Quickstart
This is a quickstart project for integrating with the Efty Pay Node.js SDK. It demonstrates how to use the SDK to interact with the Efty Pay API.

## Table of Contents

- [Efty Pay Node.js Quickstart](#efty-pay-nodejs-quickstart)
- [Requirements](#requirements)
- [Required Setup](#required-setup)
   - [Initial Setup & Token Creation](#initial-setup--token-creation)
   - [Token Creation](#token-creation)
   - [Set Your API Credentials in Environment Variables](#set-your-api-credentials-in-your-environment-variables)
   - [Important Notes](#important-notes)
- [Create & Onboard the Seller](#create--onboard-the-seller)
   - [Onboard a Seller](#onboard-a-seller)
- [Other examples](#other-examples)
   - [Generate Magic Link](#generate-magic-link)
   - [Create Transaction (with Known Seller & Buyer)](#create-transaction-with-known-seller--buyer)
   - [Get a user](#get-a-user)
   - [List transactions](#list-transactions)
- [Troubleshooting & support](#troubleshooting--support)
- [License](#license)

## Requirements
- Node.js (v16 or later).
- npm (v8 or later).
- Efty Pay API access credentials; please fill out the [access request form](https://forms.gle/fk85K45eThgepi1Q8) to obtain early access.

## Other resources
- [Efty Pay Node.js SDK](https://github.com/eftybv/efty-pay-nodejs-sdk)
- [Efty Pay API Resource Documentation](https://docs.eftypay.com)

## Required Setup

### Initial setup & token creation
Checkout this repository:
```bash
git clone https://bitbucket.org/eftypay/efty-pay-nodejs-quickstart.git
cd efty-pay-nodejs-quickstart
```

Install all dependencies by running the following in the repository root.
```bash
npm install
```

Or in case of `yarn`:
```bash
yarn install
```

#### Token creation
In order to authenticate with Efty Pay, a JWT token needs to be passed into the authorization header when making SDK request. The sample code for this can be found in the `generateToken` method in [examples/helpers.js](examples/helpers.js)

The code relies on the [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) package to do the JWT token generation in Node.js. Please make sure to include this library into your `package.json` if you want to use the [examples/helpers.js](examples/helpers.js) code:
```
"dependencies": {
   "efty-pay-nodejs-sdk": "1.0.0",
   "jsonwebtoken": "^9.0.2"
}
```

#### Set your API credentials in your environment variables
You can run all the individual samples in the [examples](examples) folder, by simply adding your API credentials to your environment:

```
export EFTY_PAY_API_KEY={{YOUR_API_KEY}}
export EFTY_PAY_API_SECRET={{YOUR_API_SECRET}}
export EFTY_PAY_INTEGRATOR_ID={{YOUR_INTEGRATOR_ID}}
export EFTY_PAY_API_URL=api.eftypay.com:443
```

Now from the root folder (and after running `npm install` or `yarn install`) you can execute the desired example scripts:
```
node create-legal-seller-user-and-intiate-onboarding-with-mangopay.js
node create-transaction-new-seller-and-buyer.js
node getTransaction.js
...
```

#### Important notes
- __It's strongly recommended that you store your API credentials server side only, and if possible encrypted. Never expose or store these credentials in your code repository or front-end code.__
- __If you think your API credentials have been leaked or compromised, please contact us immediately to invalidate your credentials.__

### Create & onboard the seller
In order for Efty Pay to process payments for a seller, and for a seller to receive payouts through Efty Pay, the seller needs to onboard with Efty Pay and go through our KYC process.
This whole process is managed through the Efty Pay web interface, but does need to be initiated by the integrator by providing Efty Pay with basic data for the seller:

- Legal status: personal or company seller.
- Name & address details.

Once you have completed this step, the seller will receive an email with a link to complete their onboarding.

If you want to redirect the seller to the onboarding wizard from your application, you can generate a magic link for them to redirect them to.

The magic link implements the Efty Pay OTP (One Time Password) process for secure access by the seller.

#### Onboard a seller
The below sample onboards a seller as legal user (company).
```js
const grpc = require('@grpc/grpc-js');
const {
    UsersClient,
    PaymentsClient,
    User,
    UserCategory,
    Address,
    VatSettings,
    UserType,
    UserStatus,
    PaymentDetails,
    MangopayDetails,
    UserRequest,
    Id,
    MangopayOnboarding,
    LegalUser,
    Person,
    LegalUserType,
    OnboardingType,
    OnboardingAddress,
    CountryCode
} = require('efty-pay-nodejs-sdk');
const { Timestamp } = require('google-protobuf/google/protobuf/timestamp_pb');
const { generateToken, generateRandomString } = require('./helpers');
require('dotenv').config();

(async () => {
    try {
        // Get the API URL
        const apiUrl = process.env.EFTY_PAY_API_URL;

        // Random string to be used in the username & email
        const randomString = generateRandomString(5);

        const metadata = new grpc.Metadata();
        metadata.add('authorization', generateToken());

        // Define the clients for the users & payments API
        const usersClient = new UsersClient(apiUrl, grpc.credentials.createSsl());
        const paymentsClient = new PaymentsClient(apiUrl, grpc.credentials.createSsl());

        // Define the seller with nested objects
        const seller = new User();
        seller.setFirstname('Patrick');
        seller.setLastname('Kosterman');
        seller.setUsername(`patrick-kosterman-seller-${randomString}`);
        seller.setEmail(`patrick-kosterman-seller-${randomString}@efty.com`);
        seller.setPassword('wasdfp-0wsdfe-mafdfrw');
        seller.setCompanyregistrationnumber('87654321');
        seller.setCompanyname('Efty Pay B.V.');

        const companyAddress = new Address();
        companyAddress.setAddressline1('Zuiderpark 17');
        companyAddress.setPostalcode('9724 AG');
        companyAddress.setCity('Groningen');
        companyAddress.setCountry(CountryCode.NL);
        seller.setCompanyaddress(companyAddress);

        const vatSettings = new VatSettings();
        vatSettings.setHasvat(true);
        seller.setVatsettings(vatSettings);

        seller.setUsertype(UserType.BUYER_OR_SELLER);
        seller.setStatus(UserStatus.ACTIVE);
        seller.setPhonenumber('+34615504467');

        const mangopayDetails = new MangopayDetails();
        mangopayDetails.setOnboardassellerwithmangopay(true);
        mangopayDetails.setUsercategory(UserCategory.OWNER);

        const paymentDetails = new PaymentDetails();
        paymentDetails.setMangopaydetails(mangopayDetails);
        seller.setPaymentdetails(paymentDetails);

        // Create the user request
        const userRequest = new UserRequest();
        userRequest.setUser(seller);

        // Create the user
        const userResponse = await new Promise((resolve, reject) => {
            usersClient.createUser(userRequest, metadata, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

        console.log('New seller user created:', userResponse.getId());

        // Create the onboarding object
        const dateOfBirth = new Date('1982-03-21');
        const timestamp = new Timestamp();
        timestamp.fromDate(dateOfBirth);

        const legalRepresentative = new Person();
        legalRepresentative.setFirstname(userResponse.getFirstname());
        legalRepresentative.setLastname(userResponse.getLastname());
        legalRepresentative.setEmail(userResponse.getEmail());
        legalRepresentative.setDateofbirth(timestamp);
        legalRepresentative.setNationality(CountryCode.NL);
        legalRepresentative.setCountryofresidence(CountryCode.NL);

        const legalUser = new LegalUser();
        legalUser.setRegisteredname(userResponse.getCompanyname());
        legalUser.setCompanynumber(userResponse.getCompanyregistrationnumber());
        legalUser.setEmail(userResponse.getEmail());

        const companyOnboardingAddress = new OnboardingAddress();
        companyOnboardingAddress.setAddressline1('Zuiderpark 17');
        companyOnboardingAddress.setPostalcode('9724 AG');
        companyOnboardingAddress.setCity('Groningen');
        companyOnboardingAddress.setCountry(CountryCode.NL);

        legalUser.setRegisteredaddress(companyOnboardingAddress);
        legalUser.setLegalrepresentative(legalRepresentative);
        legalUser.setLegalusertype(LegalUserType.BUSINESS);
        legalUser.setVatnumber('abc123');

        const mangopayOnboardingRequest = new MangopayOnboarding();
        const sellerId = new Id();
        sellerId.setId(userResponse.getId());
        mangopayOnboardingRequest.setSelleruserid(sellerId);
        mangopayOnboardingRequest.setLegaluser(legalUser);
        mangopayOnboardingRequest.setOnboardingtype(OnboardingType.LEGAL_USER);

        // Onboard the user
        const onboardingResponse = await new Promise((resolve, reject) => {
            paymentsClient.createSellerOnboardingForMangopay(mangopayOnboardingRequest, metadata, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

        console.log('New seller onboarding successfully initiated for user:', onboardingResponse.getSelleruserid().getId());

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
```

Full examples:
- Onboard natural-person seller (individual): [examples/create-individual-seller-user-and-intiate-onboarding-with-mangopay.js](./examples/create-individual-seller-user-and-intiate-onboarding-with-mangopay.js).
- Onboard legal-user seller (company): [examples/create-legal-seller-user-and-intiate-onboarding-with-mangopay.js](./examples/create-legal-seller-user-and-intiate-onboarding-with-mangopay.js).

## Other examples

### Generate magic link
The `GenerateMagicLink` method can be used to generate a magic link for the user to their Efty Pay environment. Here they can see their onboarding & transaction information.

The magic links use the Efty Pay OTP process & technology for secure access.

```js
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
```

Full examples:
- Generate generic magic link: [examples/generate-generic-magic-link.js](./examples/generate-generic-magic-link.js).
- Generate magic link for specific transaction: [examples/generate-transaction-magic-link.js](./examples/generate-transaction-magic-link.js).

### Create transaction (with known seller & buyer)
This is the most straightforward and easy way to create a transaction (including the buyer user).

Notes:
- When creating a transaction, Efty Pay will check if the user already exists by email and/or username; these values are unique within the integrator data-space in Efty Pay.
- If a user already exists, creating a transaction will throw an error, instead you should pass in the user ID of the existing user.
- To get the user details (including the ID) for an email or username, you can use the [Get User method](examples/get-user.js).

```js
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
```

Full examples:
- Create transaction (with known buyer): [examples/create-transaction-known-buyer.js](./examples/create-transaction-known-buyer.js).
- Create transaction (with no buyer): [examples/create-transaction-no-buyer.js](./examples/create-transaction-no-buyer.js).

### Get a user
You can get a user by ID, email, or username. Below sample shows getting the user by ID and email.

```js
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
```

Full examples:
- Get user: [examples/get-user.js](./examples/get-user.js).

### List transactions
You can list all transactions in your account, or you can list transactions with filter criteria. The below sample lists all transactions for a seller.

```js
const grpc = require('@grpc/grpc-js');
const {
  TransactionsClient,
  ListTransactionsRequest,
} = require('efty-pay-nodejs-sdk');
const {
  ListRequest,
  Query,
  Condition,
  ConditionOperator,
  ComparisonOperator,
} = require('efty-pay-nodejs-sdk');
const { generateToken } = require('./helpers');
require('dotenv').config();

(async () => {
  try {
    const apiUrl = process.env.EFTY_PAY_API_URL;
    const sellerId = '4VlIPczrBspb83omByVH32'; // Replace with actual seller ID

    const metadata = new grpc.Metadata();
    metadata.add('authorization', generateToken());

    const transactionsClient = new TransactionsClient(apiUrl, grpc.credentials.createSsl());

    // Build field condition
    const condition = new Condition();
    condition.setField('SellerId');
    condition.setOperator(ComparisonOperator.COMPARISON_OPERATOR_EQUALS);
    condition.setStringvalue(sellerId);

    // Build query
    const query = new Query();
    query.setConditionoperator(ConditionOperator.CONDITION_OPERATOR_AND);
    query.setFieldconditionsList([condition]);

    // Build list request
    const listRequest = new ListRequest();
    listRequest.setLimit(25);
    listRequest.setQueriesList([query]);

    // Build final request
    const transactionListRequest = new ListTransactionsRequest();
    transactionListRequest.setReturnbuyerdata(true);
    transactionListRequest.setReturnsellerdata(true);
    transactionListRequest.setListrequest(listRequest);

    // Stream the responses
    const call = transactionsClient.listTransactions(transactionListRequest, metadata);

    call.on('data', (transaction) => {
      console.log(transaction.getId());
    });

    call.on('error', (err) => {
      console.error('Error streaming transactions:', err.message);
    });

    call.on('end', () => {
      console.log('Transaction stream complete.');
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

Full examples:
- List transactions for seller: [examples/list-transactions-for-seller.js](./examples/list-transactions-for-seller.js).
- List transactions for buyer: [examples/list-transactions-for-buyer.js](./examples/list-transactions-for-buyer.js).

## Troubleshooting & support
If you run into any other issues, contact us at [api@efty.com](api@efty.com).

## License
This project is licensed under the MIT License. See the LICENSE file for details.