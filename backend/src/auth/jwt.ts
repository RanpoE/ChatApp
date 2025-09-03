import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET!
const ACCESS_TTL = '1h'

export type JwtPayload = { sub: number, username: string }

export const signAccessToken = (payload: JwtPayload) =>  jwt.sign(payload, SECRET, { expiresIn: ACCESS_TTL })

export const verifyAccessToken = (token: string): JwtPayload => jwt.verify(token, SECRET) as JwtPayload