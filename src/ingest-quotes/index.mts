import { Handler, ScheduledEvent } from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, PutCommand, PutCommandInput} from "@aws-sdk/lib-dynamodb";
import {randomUUID} from "node:crypto";

import {getRandomQuote} from "./quotes.mjs";

const ddb = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(ddb);

const { TABLE_NAME = '' } = process.env;

export const handler: Handler<ScheduledEvent, void> = async event => {
  console.log(JSON.stringify(event));

  // put a random quote into the dynamodb table
    const quote = getRandomQuote();
    const params: PutCommandInput = {
        TableName: TABLE_NAME,
        Item: {
            PK: 'QUOTES#ALL',
            SK: `INGESTED#${Date.now()}`,
            uuid: randomUUID(),
            quote,
            expiration: (Date.now() / 1000) + 3600, // 1 hour from now
        }
    }

    console.log(JSON.stringify({message: 'Saving item with random quote to dynamo', params}));

    await dynamo.send(new PutCommand(params));
};
