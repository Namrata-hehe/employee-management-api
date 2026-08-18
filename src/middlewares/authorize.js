export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if(!req.user){
            return res.status(401).json({
                message : "Authentication is required"
            });
        }

        if(!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message : "You do not have the permission"
            });
        }

        next();
    }
}