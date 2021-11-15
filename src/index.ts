import {NotionClient, NotionClientContract, RowModel} from "./NotionClient";

const factory = require('@teleology/feature-gate');

export interface PersonPageRow {
    properties: {
        Email: {
            email: string
        }
    }
}
export interface TeamPageRow {
    properties: {
        members: {
            relation: {id: string}[]
        }
    }
}

export class NotionFF {
    private notion: NotionClientContract;
    public db: Set<string> = new Set();
    private readonly user: string;
    private readonly db_id: string;

    constructor(userEmail: string, dbId: string, notionClient?: NotionClientContract) {
        this.notion = notionClient
        this.user = userEmail ?? '';
        this.db_id = dbId;
    }

    static async initialize(userEmail: string = '', dbId: string, notionClient?: NotionClientContract) {
        if (!dbId) {
            throw new Error('No DB id was provided, please pass a db id to the constructor');
        }

        const instance = new NotionFF(userEmail, dbId, notionClient ?? new NotionClient());
        await instance.loadFeatures();
        return instance;
    }

    private async loadFeatures() {
        const rowModels = await this.notion.getDatabase(this.db_id);

        for (let row of rowModels) {
            let featureEnabled = row.featureIsEnable();

            if (NotionFF.shouldLookupPage(featureEnabled, row.getPeoplePageId())) {
                featureEnabled = await this.isUserEnabled(row.getPeoplePageId());
            }

            if (NotionFF.shouldLookupPage(featureEnabled, row.getTeamPageId())) {
                featureEnabled = await this.isUserInTeam(row.getTeamPageId());
            }

            if (!featureEnabled) {
                featureEnabled = this.userInRollout(row);
            }

            if (featureEnabled) {
                this.db.add(row.getFeatureName());
            }
        }
    }

    private static shouldLookupPage(featureEnabled: boolean, pageIds: string[]): boolean {
        return !featureEnabled && pageIds.length > 0;
    }

    enabled(feature: string): boolean {
        return this.db.has(feature);
    }

    async isUserEnabled(peoplePageIds: string[]) {
        for (let pageId of peoplePageIds) {
            const personPage = await this.notion.getPersonPage(pageId);
            if ((personPage as PersonPageRow).properties.Email !== undefined) {
                const {email} = personPage.properties.Email;
                if (this.user === email) {
                    return true;
                }
            }
        }

        return false;
    }

    async isUserInTeam(teamIds: string[]) {
        for (let pageId of teamIds) {
            const teamPage = await this.notion.getTeamPage(pageId);
            const peoplePageIds = teamPage.properties.members.relation.map((row: { id: string }) => row.id);
            const isEnabled = await this.isUserEnabled(peoplePageIds);
            if (isEnabled) {
                return isEnabled;
            }
        }

        return false;
    }

    private userInRollout(result: RowModel) {
        const featureKey = result.getFeatureName();
        const gate = factory({
            [featureKey]: result.getRolloutPercentage()
        });

        return gate(featureKey, this.user);
    }
}