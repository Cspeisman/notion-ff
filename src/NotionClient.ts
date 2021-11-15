import {Client} from "@notionhq/client/build/src";
import {PersonPageRow, TeamPageRow} from "./index";

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
        }
    }
}

export interface NotionClientContract {
    getDatabase(database_id: string): Promise<RowModel[]>;
    getPage(pageId: string): Promise<PersonPageRow|TeamPageRow>;
    getPersonPage(pageId: string): Promise<PersonPageRow>;
    getTeamPage(pageId: string): Promise<TeamPageRow>;
}

export class RowModel {
    private result: FeatureFlagRow;
    private peopleIds: string[];
    private teamsIds: string[];
    constructor(result: FeatureFlagRow) {
        this.result = result;
    }

    getFeatureName() {
        return this.result.properties.Name.title[0].plain_text;
    }

    getPeoplePageId() {
        if (this.peopleIds) {
            return this.peopleIds;
        }

        this.peopleIds = this.result.properties.People.relation.map(relation => relation.id);
        return this.peopleIds;
    }

    getTeamPageId() {
        if (this.teamsIds) {
            return this.teamsIds;
        }
        this.teamsIds = this.result.properties.Teams.relation.map((row: { id: string }) => row.id);
        return this.teamsIds;
    }

    featureIsEnable() {
        return this.result.properties.Enabled.checkbox;
    }

    getRolloutPercentage() {
        return this.result.properties.Percentage.number;
    }
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

    async getDatabase(database_id: string): Promise<RowModel[]> {
        const {results} = await this.notion.databases.query({
            database_id
        });

        return results.map((result: any) => new RowModel(result as FeatureFlagRow));
    }

    async getPage(pageId: string): Promise<PersonPageRow|TeamPageRow> {
        return await this.notion.pages.retrieve({
            page_id: pageId
        }) as any as PersonPageRow | TeamPageRow;
    }
}