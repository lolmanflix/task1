import jwt from 'jsonwebtoken';

export function signJwt(payload: object, secret: string, expiresIn = '8h') {
  // cast to any to satisfy differing type definitions in jsonwebtoken typings
  return jwt.sign(payload as any, secret as any, { expiresIn } as any);
}

export function verifyJwt<T = any>(token: string, secret: string): T {
  return jwt.verify(token as any, secret as any) as T;
}
