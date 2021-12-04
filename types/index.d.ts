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
