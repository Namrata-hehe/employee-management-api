// users.email is VARCHAR(100) NOT NULL
const email = {
    type: "string",
    format: "email",
    maxLength: 100
};

export const registerBody = {
    type: "object",
    properties: {
        email,
        // bcrypt only uses the first 72 bytes of a password
        password: { type: "string", minLength: 1, maxLength: 72 }
    },
    required: ["email", "password"],
    additionalProperties: false
};

export const loginBody = {
    type: "object",
    properties: {
        email,
        password: { type: "string", minLength: 1 }
    },
    required: ["email", "password"],
    additionalProperties: false
};
