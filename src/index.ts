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


function getNow() {
    const coeff = 1000 * 60;
    return new Date(Math.round(Date.now() / coeff) * coeff).toISOString();
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

        const rows = await instance.notion.getDatabase(dbId)
        await instance.loadFeatures(rows);

        new Poller(notionClient, instance.loadFeatures, dbId, getNow());
        return instance;
    }

    loadFeatures = async (rowModels: FeatureRow[]) =>{
        for (let row of rowModels) {
            if ((await this.isRowEnabled(row))) {
                this.db.add(row.getFeatureName());
            } else {
                this.db.delete(row.getFeatureName());
            }
        }
        console.log(this.db);
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