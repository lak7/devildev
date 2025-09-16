import { Octokit } from '@octokit/rest';

export function createOctokitWithToken(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: 'DevilDev-App',
  });
}


