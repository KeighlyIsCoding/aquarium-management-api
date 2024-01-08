import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, PutCommandOutput, UpdateCommand, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Tank } from '../interfaces/tankInterface';
import { TABLE } from '../constants/table';
import { RESPONSE_MESSAGE } from '../constants/responseMessage';

interface GetTankResponse {
  data: Tank | Tank[] | undefined,
  message: string
}
interface PutTankResponse {
  data: PutCommandOutput | undefined,
  message: string
}
interface UpdateTankResponse {
  data: UpdateCommandOutput | undefined,
  error: string
}

class TankService {
  client: DynamoDBClient;
  docClient: DynamoDBDocumentClient;

  async getAllTanks(): Promise<GetTankResponse> {
    const command = new ScanCommand({
      "TableName": TABLE.TANK
    });

    try {
      const response = await this.docClient.send(command);

      if (response.Items?.length === 0) {
        return {
          data: undefined,
          message: RESPONSE_MESSAGE.NO_ITEMS_FOUND
        };
      }

      const tanks = response.Items as Tank[];

      return {
        data: tanks,
        message: RESPONSE_MESSAGE.NO_ERROR
      };
    } catch (e) {
      console.error(`failed to get tanks: ${e}`);
      return {
        data: undefined,
        message: RESPONSE_MESSAGE.INTERNAL
      };
    }
  }

  async getTankById(tank_id: string): Promise<GetTankResponse> {
    const command = new GetCommand({
      "TableName": TABLE.TANK,
      "Key": {
        "id": tank_id
      }
    });

    try {
      const response = await this.docClient.send(command);

      if (!response.Item) {
        return {
          data: undefined,
          message: RESPONSE_MESSAGE.NOT_FOUND
        };
      }

      const tank = response.Item as Tank;

      return {
        data: tank,
        message: RESPONSE_MESSAGE.NO_ERROR
      }
    } catch (e) {
      console.error(`failed to get tank with Id ${tank_id}`);
      return {
        data: undefined,
        message: RESPONSE_MESSAGE.INTERNAL
      }
    }
  }

  async createTank(tank: Tank): Promise<PutTankResponse> {
    const tank_id = uuidv4();
    tank.id = tank_id;

    const command = new PutCommand({
      "TableName": TABLE.TANK,
      "Item": tank
    });

    try {
      const response = await this.docClient.send(command);

      return {
        data: response,
        message: RESPONSE_MESSAGE.NO_ERROR
      }
    } catch (e) {
      console.error(`failed to create tank: ${e}`);

      return {
        data: undefined,
        message: RESPONSE_MESSAGE.INTERNAL
      }
    }
  }

  async putTank(tank: Tank): Promise<PutTankResponse> {
    const tank_id = tank.id;
    const getReq = await this.getTankById(tank_id);
    const exists = getReq.message === RESPONSE_MESSAGE.NO_ERROR ? true : false;

    const command = new PutCommand({
      "TableName": TABLE.TANK,
      "Item": tank
    });

    try {
      const response = await this.docClient.send(command);

      if (!exists) {
        response.$metadata.httpStatusCode = 201;

        return {
          data: response,
          message: RESPONSE_MESSAGE.NOT_FOUND
        }
      }

      return {
        data: response,
        message: RESPONSE_MESSAGE.NO_ERROR
      }
    } catch (e) {
      console.error(`failed to update tank: ${e}`);

      return {
        data: undefined,
        message: RESPONSE_MESSAGE.INTERNAL
      }
    }
  }

  /*async updateTank(tank: Tank): Promise<UpdateTankResponse> {
    const command = new
  }*/

  constructor() {
    this.client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }
}

export default TankService;