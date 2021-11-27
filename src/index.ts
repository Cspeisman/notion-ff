import {NotionClient, NotionClientContract} from "./NotionClient";
import {FeatureRow} from "./FeatureRow";
import {Poller} from "./Poller";

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

        new Poller(notionClient, async () => {
            await instance.loadFeatures(dbId);
        }, dbId);

        await instance.loadFeatures(dbId);
        return instance;
    }

    private async loadFeatures(dbId: string) {
        const rowModels = await this.notion.getDatabase(dbId);
        for (let row of rowModels) {
            if ((await this.isRowEnabled(row))) {
                this.db.add(row.getFeatureName());
            } else {
                this.db.delete(row.getFeatureName());
            }
        }
    }

    enabled(feature: string): boolean {
        return this.db.has(feature);
    }

    async isRowEnabled(row: FeatureRow) {
        if (row.featureIsEnable()) {
            return true;
        }

        if ((await row.userIsEnabled(this.user))) {
            return true
        }

        if ((await row.userIsInTeam(this.user))) {
            return true
        }

        return !!this.userInRollout(row);
    }

    private userInRollout(result: FeatureRow) {
        const featureKey = result.getFeatureName();
        const gate = factory({
            [featureKey]: result.getRolloutPercentage()
        });

        return gate(featureKey, this.user);
    }

}