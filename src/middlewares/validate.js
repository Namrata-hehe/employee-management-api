import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

function toErrors(location, errors) {
    return errors.map((e) => {
        const name =
            e.params.missingProperty ||
            e.params.additionalProperty ||
            e.instancePath.replace(/^\//, "").replace(/\//g, ".");
        return {
            field: name ? `${location}.${name}` : location,
            message: e.message
        };
    });
}

// Builds a middleware that checks req.body, req.params and req.query
// against JSON schemas and answers 400 if any of them do not match.
export function validate({ body, params, query }) {
    const checks = [
        ["body", body && ajv.compile(body), (req) => req.body ?? {}],
        ["params", params && ajv.compile(params), (req) => req.params],
        ["query", query && ajv.compile(query), (req) => req.query]
    ];

    return (req, res, next) => {
        const errors = [];

        for (const [location, check, getData] of checks) {
            if (check && !check(getData(req))) {
                errors.push(...toErrors(location, check.errors));
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors
            });
        }

        next();
    };
}
