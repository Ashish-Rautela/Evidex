export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  createdAt: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  tenant_id: string;
  'custom:tenant_id': string;
  iss: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  user: UserPublic;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  tenantId?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
