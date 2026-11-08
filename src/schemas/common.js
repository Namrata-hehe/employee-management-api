// A whole number sent in a JSON body. PostgreSQL INT goes up to 2147483647.
export const positiveInteger = {
    type: "integer",
    minimum: 1,
    maximum: 2147483647
};

// Values in the URL (path and query) always arrive as strings,
// so they are checked with a pattern instead of a number type.
export const positiveIntegerString = {
    type: "string",
    pattern: "^[1-9][0-9]*$",
    maxLength: 10
};

export const idParams = {
    type: "object",
    properties: {
        id: positiveIntegerString
    },
    required: ["id"]
};
