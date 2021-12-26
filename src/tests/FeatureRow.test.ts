import {FeatureRow} from "../FeatureRow";
import {defaultResponse, NotionClientFake} from "./utils";

describe('FeatureRow', () => {
    it('should return an array of people page ids', () => {
        defaultResponse.properties.People.relation.push({id: '123'});
        defaultResponse.properties.People.relation.push({id: '456'});
        const clientFake = new NotionClientFake();
        const featureRow = new FeatureRow(defaultResponse, clientFake);
        expect(featureRow.getPeoplePageId()).toEqual(['123', '456']);
    });

    it('should return true if user is in a feature', async () => {
        const clientFake = new NotionClientFake();
        clientFake.getEmailsFromPersonPages = jest.fn().mockResolvedValue(new Set(['test@user.com', 'fake2@user.com']));
        const featureRow = new FeatureRow(defaultResponse, clientFake);
        const isEnabled = await featureRow.userIsEnabled('test@user.com');
        expect(isEnabled).toBeTruthy();
    });

    it('should return true if user is in team in a feature', async () => {
        const clientFake = new NotionClientFake();
        defaultResponse.properties.Teams.relation.push({id: 'team1'});
        clientFake.getEmailsFromTeamPages = jest.fn().mockResolvedValue(new Set(['test@user.com', 'fake2@user.com']));
        const featureRow = new FeatureRow(defaultResponse, clientFake);
        const isEnabled = await featureRow.userIsInTeam('test@user.com');
        expect(isEnabled).toBeTruthy();
    });
});