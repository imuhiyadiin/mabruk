import hashpass from "bcryptjs";
import { createPublicKey, randomBytes } from "node:crypto";
import type { JsonWebKey as NodeJsonWebKey } from "node:crypto";
import { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import prisma from "../lip/prisma";
import { generateToken } from "../secure/generate-token";
import { AuthRequest } from "../midlewhere/auth";

// register user

export const registerUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, password, email } = req.body;

    if (!name || !password || !email) {
      return res.status(400).json({
        message: "complete data name,email and password",
        status: 400,
      });
    }

    const checkEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (checkEmail) {
      return res.status(400).json({
        message: "user email is already exist!..",
        status: 400,
      });
    }

    const passwordHash = hashpass.hashSync(password);

    // create data
    // findFirst where
    // update data where
    // delete where

    const newUser = await prisma.user.create({
      data: {
        email,
        fullname: name,
        password: passwordHash,
        role: email === "admin@gmail.com" ? "ADMIN" : "USER",
      },
      select: {
        id: true,
        email: true,
        fullname: true,
        createdAt: true,
        role: true,
      },
    });

    res.json({
      message: "user created success ✔️",
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "server error",
      status: 500,
    });
  }
};

// login user

export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "enter your email and password",
        status: 400,
      });
    }

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "wrong credentials!.",
        status: 401,
      });
    }

    const dehashPass = hashpass.compareSync(password, user?.password);

    if (!dehashPass) {
      return res.status(401).json({
        message: "wrong credentials!.",
        status: 401,
      });
    }

    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullname,
      createdAt: user.createdAt,
      role: user.role,
      access_token: generateToken({
        email: user.email,
        id: user.id,
        role: user.role,
      }),
    };

    res.json({
      message: "successfully loged!.",
      user: userData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "server error",
      status: 500,
    });
  }
};

type GoogleJwk = NodeJsonWebKey & { kid: string };

let googleKeysCache: { keys: GoogleJwk[]; expiresAt: number } | undefined;

async function getGoogleSigningKeys(): Promise<GoogleJwk[]> {
  if (googleKeysCache && googleKeysCache.expiresAt > Date.now()) {
    return googleKeysCache.keys;
  }

  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) throw new Error("Unable to retrieve Google's signing keys");

  const data = (await response.json()) as { keys: GoogleJwk[] };
  const maxAge = response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1];
  const cacheSeconds = maxAge ? Number(maxAge) : 3600;
  googleKeysCache = { keys: data.keys, expiresAt: Date.now() + cacheSeconds * 1000 };

  return data.keys;
}

export const googleUserLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body as { credential?: string };
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId || !process.env.SECRET_KEY) {
      return res.status(503).json({ message: "Google login is not configured on the server." });
    }

    if (!credential || typeof credential !== "string") {
      return res.status(400).json({ message: "Google credential is required." });
    }

    const decoded = jwt.decode(credential, { complete: true });
    if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
      return res.status(401).json({ message: "Invalid Google credential." });
    }

    const signingKey = (await getGoogleSigningKeys()).find(
      (key) => key.kid === decoded.header.kid,
    );
    if (!signingKey) {
      return res.status(401).json({ message: "Invalid Google credential." });
    }

    const publicKey = createPublicKey({
      key: signingKey,
      format: "jwk",
    });
    const claims = jwt.verify(credential, publicKey, {
      algorithms: ["RS256"],
      audience: clientId,
      issuer: ["accounts.google.com", "https://accounts.google.com"],
    }) as JwtPayload;

    const email = typeof claims.email === "string" ? claims.email : "";
    const emailVerified = claims.email_verified === true || claims.email_verified === "true";
    const googleId = typeof claims.sub === "string" ? claims.sub : "";

    if (!email || !emailVerified || !googleId) {
      return res.status(401).json({ message: "Google account could not be verified." });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const fullname = typeof claims.name === "string" ? claims.name : email.split("@")[0];
      const randomPassword = randomBytes(48).toString("base64url");
      user = await prisma.user.create({
        data: {
          fullname,
          email,
          password: hashpass.hashSync(randomPassword),
          role: "USER",
        },
      });
    }

    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullname,
      createdAt: user.createdAt,
      role: user.role,
      access_token: generateToken({ email: user.email, id: user.id, role: user.role }),
    };

    return res.json({ message: "Successfully signed in with Google.", user: userData });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid Google credential." });
    }
    return res.status(500).json({ message: "Google sign in failed." });
  }
};

// whoami

export const whoami = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user?.id },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "operation success",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "sever error",
      error,
    });
  }
};

// update user

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { fullname } = req.body;
    const { id } = req.params;

    if (!fullname) {
      return res.status(400).json({
        message: "input correct fullname ",
      });
    }
     
    
    const user = await prisma.user.findFirst({
      where: {id: id as string, },
    });

    if (!user) {
      return res.status(404).json({
        message: "User Not Found!!!.",
      });
    }

    await prisma.user.update({
      where: {
       id : user.id
      },
      data: {
        fullname
      },
    });

    res.json({
      message: "user updated success",
    });
  } catch (error) {
    res.status(500).json({
      message: "server error",
    });
  }
};

// get all users

export const allUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json({
      result: [...users],
    });
  } catch (error) {
    res.status(500).json({
      message: "server error",
      error,
    });
  }
};

// change role

export const chanegRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id, role } = req.body;

    // if (req.user?.role !== "ADMIN") {
    //   return res.status(405).json({
    //     message: "not have permission to change role",
    //   });
    // }

    if (!id || !role) {
      return res.status(400).json({
        message: "complete info",
      });
    }

    const user = await prisma.user.findFirst({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    const updateRole = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      message: "user role changed success",
      result: updateRole,
    });
  } catch (error) {
    error;
  }
}; 
