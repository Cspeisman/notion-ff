import {NotionClientContract} from "./NotionClient";
import {FeatureRow} from "./FeatureRow";

export class Poller {
    private lastEdited: string;
    constructor(notionClient: NotionClientContract, callback: (rows: FeatureRow[]) => Promise<void>, dbId: string, lastEdited: string) {
        this.lastEdited = lastEdited;
        this.poll(notionClient, callback, 3000, dbId).catch(console.error);
    }

    private async poll(notionClient: NotionClientContract, callback: (rows: FeatureRow[]) => Promise<void>, interval: number, dbId: string) {
        const lastEditedResponse = await notionClient.getLastEditedTimeForDatabase(dbId, this.lastEdited);
        if (Poller.hasChanged(lastEditedResponse.results)) {
            const rows = lastEditedResponse.results.map((result: any) => {
                this.updateLastEdited(result.last_edited_time);
                return new FeatureRow(result, notionClient)
            });

            await callback(rows);
        }

        setTimeout(() => this.poll(notionClient, callback, interval, dbId), interval);
    }

    private static hasChanged(results: any[]) {
        return results.length > 0;
    }

    private updateLastEdited(last_edited_time: string) {
        if (new Date(last_edited_time) > new Date(this.lastEdited)) {
            this.lastEdited = last_edited_time;
        }
    }
}