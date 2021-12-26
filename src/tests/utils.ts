import {FeatureRow} from "../FeatureRow";
import {FeatureFlagRow, NotionClientContract, PersonPageRow} from "../../types/notion-ff";

export const defaultResponse: FeatureFlagRow = {
    properties: {
        Enabled: {
            checkbox: false
        },
        People: {
            relation: []
        },
        Name: {
            title: [
                {
                    plain_text: "featureA",
                }
            ]
        },
        Teams: {
            relation: []
        },
        Percentage: {
            number: null
        }
    }
};

export class NotionClientFake implements NotionClientContract {
    getDatabase = (): Promise<FeatureRow[]> => Promise.resolve([defaultResponse].map(row => new FeatureRow(row, this)));
    getPage = (): Promise<PersonPageRow> => Promise.resolve(undefined);
    getEmailsFromTeamPages = (): Promise<Set<string>> => Promise.resolve(new Set());
    getEmailsFromPersonPages = (): Promise<Set<string>> => Promise.resolve(new Set());
    getLastEditedTimeForDatabase = () => Promise.resolve({results: []});
}