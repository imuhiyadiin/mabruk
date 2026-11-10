import jwt from "jsonwebtoken";
import { UserData } from "../secure/generate-token";
import { NextFunction, Request, Response } from "express";
import prisma from "../lip/prisma";
const secret = process.env.SECRET_KEY


export interface AuthRequest  extends Request {
    user?:UserData
}

export const verifyToken = async(req:AuthRequest,res:Response,next:NextFunction)=>{
    try {
        // Bearer data
        const token = req.headers.authorization?.startsWith("Bearer") && req.headers.authorization.split(" ")[1]

        if(!token){
            return res.status(401).json({
                message:"unAuthorized!."
            })
        }
        const decoded:{email:string,id:string,role:string} | any = jwt.verify(token,secret!)
        req.user = {...decoded}
        next()

    } catch (error) {
        console.log(error)
        res.status(401).json({
            message:"invalid token"
        })
    }
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
            message: "Admin access required.",
        });
    }

    next();
};

const defaultUserPermissions = ["dashboard.view", "products.view", "categories.view", "orders.view", "customers.view"];

export const requirePermission = (...requiredPermissions: string[]) => async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === "ADMIN") return next();
    if (!req.user?.id) return res.status(401).json({ message: "Authentication required." });

    try {
        const account = await prisma.user.findUnique({ where: { id: req.user.id }, select: { permissions: true, role: true } });
        const assigned = account?.permissions;
        const permissions = Array.isArray(assigned)
            ? assigned.filter((permission): permission is string => typeof permission === "string")
            : account?.role === "USER" ? defaultUserPermissions : [];
        if (!requiredPermissions.some((permission) => permissions.includes(permission))) {
            return res.status(403).json({ message: "You do not have permission to perform this action." });
        }
        return next();
    } catch {
        return res.status(500).json({ message: "Could not verify account permissions." });
    }
};
