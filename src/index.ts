import {NotionClient, NotionClientContract} from "./NotionClient";

const factory = require('@teleology/feature-gate');

interface RelationRow {
    relation: {id: string}[]
}

export interface FeatureFlagRow {
    properties: {
        Enabled: {
            checkbox: boolean
        },
        People: RelationRow,
        Teams: RelationRow,
        Name: {
            title: {plain_text: string}[]
        },
        Percentage: {
            number: number | null
        },
    }
}

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
        const results = await this.notion.getDatabase(this.db_id);

        for (let result of results) {
            let featureEnabled = NotionFF.isEnabledForAll(result);

            if (NotionFF.shouldLookupPage(featureEnabled, result.properties.People)) {
                const peoplePageIds = (result.properties.People).relation.map((row: { id: string }) => row.id);
                featureEnabled = await this.isUserEnabled(peoplePageIds);
            }

            if (NotionFF.shouldLookupPage(featureEnabled, result.properties.Teams)) {
                const teamIds = result.properties.Teams.relation.map((row: { id: string }) => row.id);
                featureEnabled = await this.isUserInTeam(teamIds);
            }

            if (!featureEnabled) {
                featureEnabled = this.userInRollout(result);
            }

            if (featureEnabled) {
                this.db.add((result.properties.Name as any).title[0].plain_text);
            }
        }
    }

    private static shouldLookupPage(featureEnabled: boolean, column: RelationRow) {
        return !featureEnabled && column.relation.length > 0;
    }

    private static isEnabledForAll(result: FeatureFlagRow) {
        return result.properties.Enabled.checkbox;
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
                return true;
            }
        }

        return false;
    }

    private userInRollout(result: FeatureFlagRow) {
        const featureKey = (result.properties.Name as any).title[0].plain_text;
        const gate = factory({
            [featureKey]: result.properties.Percentage.number
        });

        return gate(featureKey, this.user);
    }
}