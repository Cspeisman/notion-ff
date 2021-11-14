import {Client} from "@notionhq/client/build/src";
import {FeatureFlagRow, PersonPageRow, TeamPageRow} from "./index";

export interface NotionClientContract {
    getDatabase(database_id: string): Promise<FeatureFlagRow[]>;
    getPage(pageId: string): Promise<PersonPageRow|TeamPageRow>;
    getPersonPage(pageId: string): Promise<PersonPageRow>;
    getTeamPage(pageId: string): Promise<TeamPageRow>;
}

export class NotionClient implements NotionClientContract {
    private notion: Client;

    constructor(notion?: Client) {
        this.notion = notion ?? new Client({
            auth: process.env.NOTION_TOKEN,
        });
    }

    async getPersonPage(pageId: string): Promise<PersonPageRow> {
        return await this.getPage(pageId) as PersonPageRow;
    }

    async getTeamPage(pageId: string): Promise<TeamPageRow> {
        return await this.getPage(pageId) as TeamPageRow;
    }

    async getDatabase(database_id: string): Promise<FeatureFlagRow[]> {
        const {results} = await this.notion.databases.query({
            database_id
        });

        return results as any as FeatureFlagRow[]
    }

    async getPage(pageId: string): Promise<PersonPageRow|TeamPageRow> {
        return await this.notion.pages.retrieve({
            page_id: pageId
        }) as any as PersonPageRow | TeamPageRow;
    }
}