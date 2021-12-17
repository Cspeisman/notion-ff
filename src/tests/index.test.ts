import {NotionFF} from "../index";
import {FeatureRow} from "../FeatureRow";
import {defaultResponse, NotionClientFake} from "./utls";

describe('NotionFF', () => {
    it('should throw an error if the database_id is not provided', async () => {
        await expect(() => NotionFF.initialize( '', {dbId: ''}))
            .rejects
            .toThrow('No DB id was provided, please pass a db id to the constructor');
    });

    it('should tell me if a feature is enabled or not', async () => {
        const client = new NotionClientFake();
        const response = {
            properties: {
                ...defaultResponse.properties,
                Enabled: {
                    checkbox: true
                }
            }
        }

        const ff = new NotionFF( 'example@test.com', client);
        await ff.loadFeatures([new FeatureRow(response, client)])
        expect(ff.enabled('featureA')).toBeTruthy();
    });

    it('should return true when a user is enabled for a feature', async () => {
        const client = new NotionClientFake();
        const row = new FeatureRow(defaultResponse, client);
        row.userIsEnabled = jest.fn().mockResolvedValue(true);

        const ff = new NotionFF( 'user@test.com', client);
        const isEnabled = await ff.isRowEnabled(row);
        expect(isEnabled).toBeTruthy();
    });

    it('should return false when a user is not enabled on a row', async () => {
        const client = new NotionClientFake();
        const row = new FeatureRow(defaultResponse, client);
        row.userIsEnabled = jest.fn().mockResolvedValue(false);

        const ff = new NotionFF( 'user@test.com', client);
        const isEnabled = await ff.isRowEnabled(row);
        expect(isEnabled).toBeFalsy();
    });

    it('should return true if a user is in an enabled team', async () => {
        const client = new NotionClientFake();
        const row = new FeatureRow(defaultResponse, client);
        row.userIsInTeam = jest.fn().mockResolvedValue(true);

        const ff = new NotionFF( 'user@test.com', client);
        const isEnabled = await ff.isRowEnabled(row);
        expect(isEnabled).toBeTruthy();
    });
});