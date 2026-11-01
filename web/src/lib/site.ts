// Project links and commands. Commands match the repository README.

export const REPO_URL = "https://github.com/yagnang-vyas/compose-guard";
export const REPO_LINKS = {
  repo: REPO_URL,
  readme: `${REPO_URL}#readme`,
  issues: `${REPO_URL}/issues`,
  newIssue: `${REPO_URL}/issues/new`,
  spec: `${REPO_URL}/blob/main/SPEC.md`,
  contributing: `${REPO_URL}/blob/main/AGENTS.md`,
  changelog: `${REPO_URL}/blob/main/CHANGELOG.md`,
  license: `${REPO_URL}/blob/main/LICENSE`,
  examples: `${REPO_URL}/tree/main/examples`,
  web: `${REPO_URL}/tree/main/web`,
} as const;

export function repoFile(path: string): string {
  return `${REPO_URL}/blob/main/${path}`;
}

export const INSTALL_COMMANDS = ["pip install compose-guard", "compose-guard --version"].join("\n");

export const PIP_GIT_INSTALL = `pip install git+${REPO_URL}.git`;
