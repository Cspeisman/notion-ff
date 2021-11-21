import {NotionClient, NotionClientContract} from "./NotionClient";
import {FeatureRow} from "./FeatureRow";

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
        member_emails: {
            rollup: {
                array: { email: string }[]
            },
        }
        members: {
            relation: {id: string}[]
        }
    }
}

export class NotionFF {
    private notion: NotionClientContract;
    public db: Set<string> = new Set();
    private readonly user: string;

    constructor(userEmail: string, notionClient?: NotionClientContract) {
        this.notion = notionClient
        this.user = userEmail ?? '';
    }

    static async initialize(userEmail: string = '', dbId: string, client?: NotionClientContract) {
        if (!dbId) {
            throw new Error('No DB id was provided, please pass a db id to the constructor');
        }

        const notionClient = client ?? new NotionClient();
        const instance = new NotionFF(userEmail, notionClient);
        await instance.loadFeatures(dbId);
        return instance;
    }

    private async loadFeatures(dbId: string) {
        const rowModels = await this.notion.getDatabase(dbId);
        for (let row of rowModels) {
            let featureEnabled = row.featureIsEnable();

            if (!featureEnabled) {
                featureEnabled = await this.isUserEnabled(row);
            }

            if (!featureEnabled) {
                featureEnabled = await this.isUserInTeam(row);
            }

            if (!featureEnabled) {
                featureEnabled = this.userInRollout(row);
            }

            if (featureEnabled) {
                this.db.add(row.getFeatureName());
            }
        }
    }

    enabled(feature: string): boolean {
        return this.db.has(feature);
    }

    async isUserEnabled(row: FeatureRow) {
        return (await row.userIsEnabled(this.user));
    }

    async isUserInTeam(row: FeatureRow) {
        return (await row.userIsInTeam(this.user));
    }

    private userInRollout(result: FeatureRow) {
        const featureKey = result.getFeatureName();
        const gate = factory({
            [featureKey]: result.getRolloutPercentage()
        });

        return gate(featureKey, this.user);
    }
}