import {FeatureFlagRow, NotionClientContract, Properties} from "../types/notion-ff";
const factory = require("@teleology/feature-gate");

export class FeatureRow {
    private properties: Properties;
    private notionClient: NotionClientContract;

    constructor(result: FeatureFlagRow, notionClient: NotionClientContract) {
        this.properties = result.properties;
        this.notionClient = notionClient;
    }

    getFeatureName() {
        return this.properties.Name.title[0]?.plain_text || '';
    }

    getPeoplePageId() {
        return this.properties.People.relation.map(relation => relation.id);
    }

    getTeamPageId() {
        return this.properties.Teams.relation.map((row: { id: string }) => row.id);
    }

    featureIsEnable() {
        return this.properties.Enabled.checkbox;
    }

    getRolloutPercentage() {
        return this.properties.Percentage.number;
    }

    async userIsEnabled(user: string): Promise<boolean> {
        return (await this.notionClient.getEmailsFromPersonPages(this.getPeoplePageId())).has(user);
    }

    async userIsInTeam(user: string): Promise<boolean> {
        return (await this.notionClient.getEmailsFromTeamPages(this.getTeamPageId())).has(user);
    }

    async isEnabled(user: string): Promise<boolean> {
        if (this.featureIsEnable()) {
            return true;
        }

        if ((await this.userIsEnabled(user))) {
            return true
        }

        if ((await this.userIsInTeam(user))) {
            return true
        }

        return !!this.userInRollout(user);
    }

    private userInRollout(user: string) {
        const featureKey = this.getFeatureName();
        const gate = factory({
            [featureKey]: this.getRolloutPercentage()
        });

        return gate(featureKey, user);
    }
}