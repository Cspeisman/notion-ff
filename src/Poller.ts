import {NotionClientContract} from "./NotionClient";
import {FeatureRow} from "./FeatureRow";

export class Poller {
    constructor(notionClient: NotionClientContract, callback: () => Promise<void>, dbId: string) {
        this.poll(notionClient, callback, 3000, dbId).catch(console.error);
    }

    private async poll(notionClient: NotionClientContract, callback: () => Promise<void>, interval: number, dbId: string) {
        const response = await notionClient.getDatabase(dbId);
        if (this.hasChanged(response)) {
            console.log("calling.....");
            await callback();
        }

        setTimeout(() => this.poll(notionClient, callback, interval, dbId), interval);
    }

    private hasChanged(response: FeatureRow[]) {
        return true;
    }
}