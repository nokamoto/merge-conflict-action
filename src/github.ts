export interface repo {
  token: string;
  owner: string;
  repo: string;
}

export interface pull {
  number: number;
  mergeable_state: string;
  pushed_at?: string;
}

export function pretty(res: { status: number; url: string }): string {
  return JSON.stringify(res);
}
