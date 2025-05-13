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