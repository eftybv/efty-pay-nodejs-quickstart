const grpc = require('@grpc/grpc-js');
const {
    UsersClient,
    PaymentsClient,
    User,
    Address,
    VatSettings,
    UserType,
    UserStatus,
    PaymentDetails,
    MangopayDetails,
    UserCategory,
    UserRequest,
    Id,
    MangopayOnboarding,
    Person,
    OnboardingType,
    CountryCode
} = require('efty-pay-nodejs-sdk');
const { Timestamp } = require('google-protobuf/google/protobuf/timestamp_pb');
const { generateToken, generateRandomString } = require('./helpers');
require('dotenv').config();

(async () => {
    try {
        const apiUrl = process.env.EFTY_PAY_API_URL;
        const randomString = generateRandomString(5);

        const metadata = new grpc.Metadata();
        metadata.add('authorization', generateToken());

        const usersClient = new UsersClient(apiUrl, grpc.credentials.createSsl());
        const paymentsClient = new PaymentsClient(apiUrl, grpc.credentials.createSsl());

        const seller = new User();
        seller.setFirstname('Patrick');
        seller.setLastname('Kosterman');
        seller.setUsername(`patrick-kosterman-seller-${randomString}`);
        seller.setEmail(`patrick-kosterman-seller-${randomString}@efty.com`);
        seller.setPassword('wasdfp-0wsdfe-mafdfrw');

        const companyAddress = new Address();
        companyAddress.setAddressline1('Zuiderpark 17');
        companyAddress.setPostalcode('9724 AG');
        companyAddress.setCity('Groningen');
        companyAddress.setCountry(CountryCode.NL);
        seller.setCompanyaddress(companyAddress);

        const vatSettings = new VatSettings();
        vatSettings.setHasvat(false);
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

        const userRequest = new UserRequest();
        userRequest.setUser(seller);

        const userResponse = await new Promise((resolve, reject) => {
            usersClient.createUser(userRequest, metadata, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

        console.log('New seller user created:', userResponse.getId());

        const dob = new Date('1982-04-12');
        const timestamp = new Timestamp();
        timestamp.fromDate(dob);

        const naturalUser = new Person();
        naturalUser.setFirstname(userResponse.getFirstname());
        naturalUser.setLastname(userResponse.getLastname());
        naturalUser.setEmail(userResponse.getEmail());
        naturalUser.setDateofbirth(timestamp);
        naturalUser.setNationality(CountryCode.NL);
        naturalUser.setCountryofresidence(CountryCode.NL);

        const mangopayOnboardingRequest = new MangopayOnboarding();
        const sellerId = new Id();
        sellerId.setId(userResponse.getId());

        mangopayOnboardingRequest.setSelleruserid(sellerId);
        mangopayOnboardingRequest.setNaturaluser(naturalUser);
        mangopayOnboardingRequest.setOnboardingtype(OnboardingType.NATURAL_USER);

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
