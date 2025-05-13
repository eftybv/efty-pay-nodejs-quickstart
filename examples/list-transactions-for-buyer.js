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
        const buyerId = '100GowQBda6vBs3MHBkFCw'; // Replace with actual buyer ID

        const metadata = new grpc.Metadata();
        metadata.add('authorization', generateToken());

        const transactionsClient = new TransactionsClient(apiUrl, grpc.credentials.createSsl());

        // Build field condition for BuyerId
        const condition = new Condition();
        condition.setField('BuyerId');
        condition.setOperator(ComparisonOperator.COMPARISON_OPERATOR_EQUALS);
        condition.setStringvalue(buyerId);

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

        // Stream the transactions
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
