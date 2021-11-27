import {NotionFF} from "../index";
import {FeatureFlagRow} from "../NotionClient";
import {FeatureRow} from "../FeatureRow";
import {defaultResponse, NotionClientFake} from "./utls";


describe('NotionFF', () => {
    it('should throw an error if the database_id is not provided', async () => {
        const client = new NotionClientFake();
        await expect(() => NotionFF.initialize( '', undefined, client))
            .rejects
            .toThrow('No DB id was provided, please pass a db id to the constructor');
    });

    it('should query the database after instantiating a new object', async () => {
        const client = new NotionClientFake();
        const ff = await NotionFF.initialize( 'example@test.com', '1234', client);
        expect(ff.enabled('featureA')).toBeFalsy();
    });

    it('should tell me if a feature is enabled or not', async () => {
        const client = new NotionClientFake();
        client.getDatabase = () => {
            const response = {
                properties: {
                ...defaultResponse.properties,
                    Enabled: {
                        checkbox: true
                    }
                }
            } as FeatureFlagRow;
            return Promise.resolve([new FeatureRow(response, client)]);
        }

        const ff = await NotionFF.initialize( 'example@test.com', '1234', client);
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