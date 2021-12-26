import {FeatureRow} from "./FeatureRow";
import getNow from "./utils/getNow";
import {NotionClientContract} from "../types/notion-ff";

export class Poller {
    private lastEdited: string;
    private readonly notionClient: NotionClientContract;

    constructor(notionClient: NotionClientContract, lastEdited?: string) {
        this.lastEdited = lastEdited ?? getNow();
        this.notionClient = notionClient;
    }

    public async poll(callback: (rows: FeatureRow[]) => Promise<void>, dbId: string, interval: number = 3000): Promise<void> {
        const {results} = await this.notionClient.getLastEditedTimeForDatabase(dbId, this.lastEdited);
        if (Poller.hasChanged(results)) {
            const rows = results.map((result: any) => {
                this.updateLastEdited(result.last_edited_time);
                return new FeatureRow(result, this.notionClient)
            });

            await callback(rows);
        }

        setTimeout(() => this.poll(callback, dbId, interval), interval);
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