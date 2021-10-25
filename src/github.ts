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
