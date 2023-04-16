import {Handler, APIGatewayEvent} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, QueryCommand, QueryCommandInput} from "@aws-sdk/lib-dynamodb";

const ddb = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(ddb);

interface Response {
    statusCode: number;
    body: string;
}

const { TABLE_NAME = '' } = process.env;

export const handler: Handler<APIGatewayEvent, Response> = async event => {
    console.log(JSON.stringify(event));

    try {
        // query the dynamodb table for the latest quote
        const params: QueryCommandInput = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": "QUOTES#ALL",
            },
            ScanIndexForward: false,
            Limit: 1,
        }

        const {Items, Count} = await dynamo.send(new QueryCommand(params));

        if (Count === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({message: 'No quotes found'})
            };
        }

        const {quote, SK} = Items[0];
        const ingestTime = SK.split('#')[1];

        return {
            statusCode: 200,
            body: JSON.stringify({quote, ingestTime}),
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({message: 'Something went wrong, please try again later...'})
        };
    }
};
