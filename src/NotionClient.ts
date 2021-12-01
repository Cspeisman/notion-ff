import {Client} from "@notionhq/client/build/src";
import {PersonPageRow, TeamPageRow} from "./index";
import {FeatureRow} from "./FeatureRow";

interface RelationRow {
    relation: {id: string}[]
}

export type Properties = {
    Enabled: {
        checkbox: boolean
    },
    People: RelationRow,
    Teams: RelationRow,
    Name: {
        title: { plain_text: string }[]
    },
    Percentage: {
        number: number | null
    }
};

export interface FeatureFlagRow {
    properties: Properties
}

export interface NotionClientContract {
    getDatabase(database_id: string): Promise<FeatureRow[]>;
    getPage(pageId: string): Promise<PersonPageRow|TeamPageRow>;
    getEmailsFromTeamPages(teamPageIds: string[]): Promise<Set<string>>;
    getLastEditedTimeForDatabase(databaseId: string, lastEditedTime: string): Promise<any>;
    getEmailsFromPersonPages(peoplePageIds: string[]): Promise<Set<string>>;
}

export class NotionClient implements NotionClientContract{
    private notion: Client;

    constructor(notion?: Client) {
        this.notion = notion ?? new Client({
            auth: process.env.NOTION_TOKEN,
        });
    }

    async getEmailsFromPersonPages(peoplePageIds: string[]): Promise<Set<string>> {
        const requests = peoplePageIds.map(id => this.getPage(id));
        const responses = await Promise.all(requests);
        const emails = responses.map((response: PersonPageRow) => response.properties.Email.email);
        return new Set(emails);
    }

    async getEmailsFromTeamPages(teamPageIds: string[]): Promise<Set<string>> {
        const requests = teamPageIds.map(id => this.getPage(id));
        const responses = await Promise.all(requests);
        const teamMemberEmails = responses.map((response: TeamPageRow) => {
            return response.properties.member_emails.rollup.array.map((obj: any) => obj.email);
        });

        return new Set(teamMemberEmails.flat());
    }

    async getDatabase(database_id: string): Promise<FeatureRow[]> {
        const {results} = await this.notion.databases.query({database_id});
        return results.map((result: any) => new FeatureRow(result, this));
    }

    async getLastEditedTimeForDatabase(database_id: string, lastEditedTime: string): Promise<any> {
        return  await this.notion.databases.query({
            database_id,
            filter: {
                property: 'last_edited',
                date: {
                    on_or_after: lastEditedTime
                }
            }
        });
    }

    async getPage(pageId: string): Promise<PersonPageRow|TeamPageRow> {
        return await this.notion.pages.retrieve({
            page_id: pageId
        }) as any as PersonPageRow | TeamPageRow;
    }
}