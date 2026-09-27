import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, SignUpCommand, AdminConfirmSignUpCommand, InitiateAuthCommand, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse, wrapHandler } from '../middleware/error.middleware.js';
import { parseBody } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  tenantId: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ponytail: basic strength checks matching auth-service — upgrade path is Cognito password policy
function validatePassword(password: string): string | null {
  const errors: string[] = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('one digit');
  return errors.length > 0 ? `Password must contain: ${errors.join(', ')}.` : null;
}

async function handleSignup(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = parseBody(event.body, SignupSchema);
  const pwdError = validatePassword(body.password);
  if (pwdError) return errorResponse(400, pwdError);

  const tenantId = body.tenantId?.trim() || `tenant_${Date.now().toString(36)}`;

  try {
    // 1. Sign up in Cognito
    const signUpResult = await cognito.send(new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: body.email,
      Password: body.password,
      UserAttributes: [
        { Name: 'email', Value: body.email },
        { Name: 'name', Value: body.name },
        { Name: 'custom:tenant_id', Value: tenantId },
      ],
    }));

    // 2. Auto-confirm (skip email verification for now)
    await cognito.send(new AdminConfirmSignUpCommand({
      UserPoolId: USER_POOL_ID,
      Username: body.email,
    }));

    // 3. Sign in to get tokens
    const authResult = await cognito.send(new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: body.email,
        PASSWORD: body.password,
      },
    }));

    const tokens = authResult.AuthenticationResult;
    return successResponse({
      message: 'Account created successfully',
      accessToken: tokens?.AccessToken,
      idToken: tokens?.IdToken,
      user: { id: signUpResult.UserSub || body.email, email: body.email, name: body.name, tenantId },
    }, 201);
  } catch (err: any) {
    if (err.name === 'UsernameExistsException') {
      return errorResponse(409, 'An account with this email already exists.');
    }
    if (err.name === 'InvalidPasswordException') {
      return errorResponse(400, err.message || 'Password does not meet requirements.');
    }
    console.error('Signup error:', err);
    return errorResponse(500, err.message || 'Signup failed');
  }
}

async function handleLogin(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = parseBody(event.body, LoginSchema);

  try {
    const authResult = await cognito.send(new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: body.email,
        PASSWORD: body.password,
      },
    }));

    const tokens = authResult.AuthenticationResult;

    // Fetch user attributes to return profile
    let user: any = { email: body.email };
    if (tokens?.AccessToken) {
      try {
        const userInfo = await cognito.send(new GetUserCommand({
          AccessToken: tokens.AccessToken,
        }));
        const attrs = Object.fromEntries(
          (userInfo.UserAttributes || []).map((a: any) => [a.Name, a.Value])
        );
        user = {
          id: attrs['sub'] || body.email,
          email: attrs['email'] || body.email,
          name: attrs['name'] || '',
          tenantId: attrs['custom:tenant_id'] || 'default-tenant',
        };
      } catch { /* non-fatal, return minimal user */ }
    }

    return successResponse({
      message: 'Login successful',
      accessToken: tokens?.AccessToken,
      idToken: tokens?.IdToken,
      user,
    });
  } catch (err: any) {
    if (err.name === 'NotAuthorizedException' || err.name === 'UserNotFoundException') {
      return errorResponse(401, 'Invalid email or password.');
    }
    console.error('Login error:', err);
    return errorResponse(500, err.message || 'Login failed');
  }
}

async function handleMe(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(401, 'Missing Authorization header');
  }

  const accessToken = authHeader.substring(7);
  try {
    const userInfo = await cognito.send(new GetUserCommand({ AccessToken: accessToken }));
    const attrs = Object.fromEntries(
      (userInfo.UserAttributes || []).map((a: any) => [a.Name, a.Value])
    );
    return successResponse({
      user: {
        id: attrs['sub'] || userInfo.Username,
        email: attrs['email'] || userInfo.Username,
        name: attrs['name'] || '',
        tenantId: attrs['custom:tenant_id'] || 'default-tenant',
      },
    });
  } catch (err: any) {
    return errorResponse(401, 'Invalid or expired token');
  }
}

async function handleVerify(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = parseBody(event.body, z.object({ token: z.string() }));
  try {
    const userInfo = await cognito.send(new GetUserCommand({ AccessToken: body.token }));
    const attrs = Object.fromEntries(
      (userInfo.UserAttributes || []).map((a: any) => [a.Name, a.Value])
    );
    return successResponse({ valid: true, payload: { sub: attrs['sub'], email: attrs['email'], tenant_id: attrs['custom:tenant_id'] } });
  } catch {
    return errorResponse(401, 'Invalid or expired token');
  }
}

export const handler = wrapHandler(async (event: APIGatewayProxyEventV2) => {
  const route = event.routeKey || '';
  if (route.includes('signup')) return handleSignup(event);
  if (route.includes('login')) return handleLogin(event);
  if (route.includes('verify')) return handleVerify(event);
  if (route.includes('logout')) return successResponse({ message: 'Logged out' });
  if (route.includes('me')) return handleMe(event);
  return errorResponse(404, 'Auth route not found');
});
