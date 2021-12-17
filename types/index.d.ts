import {FeatureRow} from "../src/FeatureRow";

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
