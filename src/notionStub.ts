export const db = {
    results: [
        {
            properties: {
                Enabled: {
                    checkbox: true
                },
                Name: {
                    title: [
                        {
                            plain_text: "featureA",
                        }
                    ]
                }
            }
        },
        {
            properties: {
                People: {
                    relation: [
                        {
                            id: "a550328d-1dc9-48e7-be2f-3233a75ab379"
                        }
                    ]
                },
                Enabled: {
                    checkbox: false
                },
                Name: {
                    title: [
                        {
                            plain_text: "featureB",
                        }
                    ]
                }
            }
        }
    ]
}

export const person = {
    properties: {
        'Related to Feature Flag DB (People)': {
            id: "_p_m",
            type: "relation",
            relation: [
                {
                    id: "256a586f-425a-48e2-8026-f1e286a91495"
                }
            ]
        },
        Email: { id: 'jaoL', type: 'email', email: 'user@test.com' }
    },
}