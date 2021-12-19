import {FeatureRow} from "./FeatureRow";
import {NotionClientContract, PersonPageRow, TeamPageRow} from "../types";
import axios from "axios";

export class NotionClient implements NotionClientContract {
    private readonly authToken: string;

    constructor(authToken: string) {
        this.authToken = authToken ?? process.env.NOTION_AUTH_TOKEN;

        if (!this.authToken) {
            throw new Error("No auth token provided");
        }
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
        // notion api doesn't support CORS so using a DARKLANG application as a proxy
        // const {data} = await axios.post(`https://api.notion.com/v1/databases/${database_id}/query`, {}, this.getHeaders());
        const {data} = await axios.get(`https://cspeisman.builtwithdark.com/notion-db/${database_id}`, this.getHeaders());
        return data.map((result: any) => new FeatureRow(result, this));
    }

    private getHeaders() {
        return {
            headers: {
                Authorization: `Bearer ${this.authToken}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2021-08-16',
            }
        };
    }

    async getLastEditedTimeForDatabase(database_id: string, lastEditedTime: string): Promise<any> {
        const body = JSON.stringify({
            filter: {
                property: 'last_edited',
                date: {
                    on_or_after: lastEditedTime
                }
            }
        });
        // notion api doesn't support CORS so using a DARKLANG application as a proxy
        const {data} = await axios.post(`https://cspeisman.builtwithdark.com/notion-db/${database_id}`, body, this.getHeaders());
        return {results: data};
    }

    async getPage(pageId: string): Promise<PersonPageRow|TeamPageRow> {
        // notion api doesn't support CORS so using a DARKLANG application as a proxy
        // const {data} = await axios.get(`https://api.notion.com/v1/pages/${pageId}`, this.getHeaders());
        const {data} = await axios.get(`https://cspeisman.builtwithdark.com/notion-page/${pageId}`, this.getHeaders());
        return data;
    }
}