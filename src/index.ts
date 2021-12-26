import {NotionClient} from "./NotionClient";
import {FeatureRow} from "./FeatureRow";
import {Poller} from "./Poller";
import {NotionClientContract} from "../types/index";

const factory = require('@teleology/feature-gate');

export class NotionFF {
    private notion: NotionClientContract;
    public db: Set<string> = new Set();
    private readonly user: string;
    private readonly poller: Poller;
    private callback: any;

    constructor(userEmail: string, notionClient?: NotionClientContract, poller?: Poller) {
        this.notion = notionClient
        this.user = userEmail ?? '';
        this.poller = poller ?? new Poller(notionClient);
    }

    static async initialize(userEmail: string = '', {dbId, authToken, poller}: {dbId: string, authToken?: string, poller?: Poller}, callback: any) {
        if (!dbId) {
            throw new Error('No DB id was provided, please pass a db id to the constructor');
        }

        const notionClient = new NotionClient(authToken);
        const instance = new NotionFF(userEmail, notionClient, poller);

        const rows = await instance.notion.getDatabase(dbId)
        instance.callback = callback;
        await instance.loadFeatures(rows);
        instance.poller.poll(instance.loadFeatures, dbId).catch(console.error);

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
        this.callback(this);
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