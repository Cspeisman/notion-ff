import {NotionFF, PersonPageRow, TeamPageRow} from "./index";
import {FeatureFlagRow, NotionClientContract, RowModel} from "./NotionClient";

const defaultResponse: FeatureFlagRow = {
    properties: {
        Enabled: {
            checkbox: false
        },
        People: {
            relation: []
        },
        Name: {
            title: [
                {
                    plain_text: "featureA",
                }
            ]
        },
        Teams: {
            relation: []
        },
        Percentage: {
            number: null
        }
    }
};

class NotionClientFake implements NotionClientContract {
    getDatabase = (): Promise<RowModel[]> => Promise.resolve([defaultResponse].map(row => new RowModel(row)));
    getPage = (): Promise<PersonPageRow> => Promise.resolve(undefined);
    getPersonPage = (): Promise<PersonPageRow> => Promise.resolve(undefined);
    getTeamPage = (): Promise<TeamPageRow> => Promise.resolve(undefined);
}

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
            return Promise.resolve([new RowModel(response)]);
        }

        const ff = await NotionFF.initialize( 'example@test.com', '1234', client);
        expect(ff.enabled('featureA')).toBeTruthy();
    });

    it('should tell me if a feature is enabled for a user', async () => {
        const client = new NotionClientFake();
        client.getDatabase = () => {
            const response = {
                properties: {
                    ...defaultResponse.properties,
                    People: {
                        relation: [{
                            id: "1234"
                        }]
                    }
                }
            };

            return Promise.resolve([new RowModel(response)]);
        }

        client.getPersonPage = jest.fn().mockResolvedValue({
            properties: {
                Email: {
                    email: 'user@test.com'
                }
            }
        });
        const ff = await NotionFF.initialize( 'user@test.com', '1234', client);
        expect(ff.enabled('featureA')).toBe(true);
    });

    it('should loop over all people page ids', async () => {
        const pageIds = ['1', '2'];
        const client = new NotionClientFake();
        client.getPersonPage = jest.fn().mockReturnValue(Promise.resolve({
            properties: {
                Email: {
                    email: 'do not match'
                }
            }
        }));

        const ff = new NotionFF( 'user@test.com', '1234', client);
        const result = await ff.isUserEnabled(pageIds);
        expect(client.getPersonPage).toHaveBeenCalledTimes(2);
        expect(result).toBeFalsy();
    });

    it('should return true if a user is in an enabled team', async () => {
        const client = new NotionClientFake();
        client.getTeamPage = jest.fn().mockResolvedValue({
            properties: {
                members: {
                    relation: [{id: '1'}]
                }
            }
        });

        client.getPersonPage = jest.fn().mockResolvedValue({
            properties: {
                Email: {
                    email: 'user@test.com'
                }
            }
        });

        const ff = await new NotionFF( 'user@test.com', '', client);
        const enabled = await ff.isUserInTeam(['123']);
        expect(enabled).toBeTruthy();
    });
});