import {NotionClient} from "./NotionClient";
import {FeatureRow} from "./FeatureRow";
import {Poller} from "./Poller";
import {NotionClientContract} from "../types/notion-ff";

type Callback = (features: NotionFF, featureSet: Set<string>) => void;

export class NotionFF {
    private notionClient: NotionClientContract;
    public db: Set<string> = new Set();
    private readonly user: string;
    private readonly poller?: Poller;
    private readonly callback: Callback;

    constructor(userEmail: string, notionClient?: NotionClientContract, poll?: number, callback?: Callback) {
        this.notionClient = notionClient
        this.user = userEmail ?? '';
        this.poller = poll ? new Poller(notionClient) : null;
        this.callback = callback ?? (() => {});
    }

    static async initialize(userEmail: string = '', {dbId, authToken, poll }: {dbId: string, authToken?: string, poll?: number}, callback?: Callback) {
        if (!dbId) {
            throw new Error('No DB id was provided, please pass a db id to the constructor');
        }

        const instance = new NotionFF(userEmail, new NotionClient(authToken), poll, callback);
        const rows = await instance.notionClient.getDatabase(dbId);
        await instance.loadFeatures(rows);

        if (instance.poller) {
            instance.poller.poll(instance.loadFeatures, dbId, poll).catch(console.error);
        }

        return instance;
    }

    loadFeatures = async (rowModels: FeatureRow[]) =>{
        for (let row of rowModels) {
            await this.addOrRemoveFeatureFromDB(row);
        }

        this.callback(this, new Set(this.db));
    }

    enabled(feature: string): boolean {
        return this.db.has(feature);
    }

    private async addOrRemoveFeatureFromDB(row: FeatureRow) {
        (await row.isEnabled(this.user)) ? this.db.add(row.getFeatureName()) : this.db.delete(row.getFeatureName());
    }
}