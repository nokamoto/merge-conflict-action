export interface repo {
  token: string;
  owner: string;
  repo: string;
}

export interface label {
  name?: string;
}

export interface pull {
  number: number;
  mergeable_state: string;
  labels: label[];
  pushed_at?: string;
}

export function pretty(res: { status: number; url: string }): string {
  try {
    return JSON.stringify({ status: res.status, url: res.url });
  } catch (e) {
    return "";
  }
}
