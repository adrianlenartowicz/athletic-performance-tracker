import { createServer, type IncomingMessage } from 'node:http';
import { randomBytes } from 'node:crypto';
import { URL } from 'node:url';
import {
  createUserWithChildren,
  describeDatabaseUrl,
  disconnectAdminPrisma,
  generateTemporaryPassword,
  getDatabaseUrl,
  getGroups,
  isTestType,
  isUserRole,
  normalizeEmail,
  TEST_TYPES,
  type ChildInput,
  type TargetEnvironment,
} from './admin-user-core';

const HOST = '127.0.0.1';
const PORT = Number(process.env.ADMIN_UI_PORT ?? 4317);
const TOKEN = randomBytes(24).toString('base64url');

type Row = {
  name: string;
  birthYear: string;
  groupId: string;
  testType: string;
  value: string;
  testedAt: string;
};

function getEnvironment(): TargetEnvironment {
  const arg = process.argv.find((value) => value.startsWith('--environment='));
  const environment = arg?.split('=')[1];
  if (environment === 'production' || environment === 'staging') return environment;
  throw new Error('--environment must be production or staging.');
}

function send(status: number, body: string, type = 'text/html; charset=utf-8') {
  return {
    status,
    body,
    headers: {
      'content-type': type,
      'cache-control': 'no-store',
      'x-frame-options': 'DENY',
    },
  };
}

function parseBody(req: IncomingMessage) {
  return new Promise<URLSearchParams>((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error('Request body is too large.'));
    });
    req.on('end', () => resolve(new URLSearchParams(body)));
    req.on('error', reject);
  });
}

function groupRows(params: URLSearchParams): Row[] {
  const names = params.getAll('childName');
  const years = params.getAll('birthYear');
  const groups = params.getAll('groupId');
  const testTypes = params.getAll('testType');
  const values = params.getAll('value');
  const dates = params.getAll('testedAt');

  return names.map((name, index) => ({
    name,
    birthYear: years[index] ?? '',
    groupId: groups[index] ?? '',
    testType: testTypes[index] ?? '',
    value: values[index] ?? '',
    testedAt: dates[index] ?? '',
  }));
}

function rowsToChildren(rows: Row[]) {
  const children = new Map<string, ChildInput>();

  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;

    const birthYear = Number(row.birthYear);
    if (!Number.isInteger(birthYear)) throw new Error(`Invalid birth year for ${name}.`);

    const key = `${name}|${birthYear}|${row.groupId}`;
    const child =
      children.get(key) ??
      ({
        name,
        birthYear,
        groupId: row.groupId,
        results: [],
      } satisfies ChildInput);

    if (row.testType || row.value || row.testedAt) {
      if (!isTestType(row.testType)) throw new Error(`Invalid test type for ${name}.`);
      const value = Number(row.value);
      const testedAt = new Date(row.testedAt);
      if (!Number.isFinite(value)) throw new Error(`Invalid result value for ${name}.`);
      if (Number.isNaN(testedAt.getTime())) throw new Error(`Invalid test date for ${name}.`);
      child.results.push({ testType: row.testType, value, testedAt });
    }

    children.set(key, child);
  }

  return [...children.values()];
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function page(environment: TargetEnvironment, database: string, message = '') {
  const emptyRows = Array.from({ length: 6 }, () => ({
    name: '',
    birthYear: '',
    groupId: '',
    testType: '',
    value: '',
    testedAt: '',
  }));
  return pageWithRows(environment, database, message, {
    email: '',
    emailRepeat: '',
    role: 'PARENT',
    confirmation: '',
    rows: emptyRows,
  });
}

async function pageWithRows(
  environment: TargetEnvironment,
  database: string,
  message: string,
  state: {
    email: string;
    emailRepeat: string;
    role: string;
    confirmation: string;
    rows: Row[];
  }
) {
  const groups = await getGroups();
  const rowCount = Math.max(6, state.rows.length);
  const groupOptions = groups
    .map(
      (group) =>
        `<option value="${group.id}">${escapeHtml(
          group.location ? `${group.name} (${group.location})` : group.name
        )}</option>`
    )
    .join('');
  const testOptions = TEST_TYPES.map((type) => `<option value="${type}">${type}</option>`).join('');
  const confirmation = environment === 'production' ? 'CREATE PRODUCTION USER' : 'CREATE STAGING USER';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>User Onboarding</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; color: #171717; background: #fff; font-size: 14px; }
    header, main { max-width: 1120px; margin: 0 auto; padding: 16px 20px; }
    header { border-bottom: 1px solid #e5e5e5; }
    h1 { margin: 0 0 4px; font-size: 20px; line-height: 1.2; }
    h2 { margin: 22px 0 8px; font-size: 15px; line-height: 1.2; }
    p { margin: 0; color: #666; }
    .danger { color: #b42318; font-weight: 700; }
    .message { margin-top: 12px; white-space: pre-wrap; color: #0f6b3f; font-weight: 700; }
    label { display: grid; gap: 5px; font-weight: 700; }
    input, select, button { font: inherit; height: 36px; border-radius: 6px; border: 1px solid #d4d4d4; padding: 7px 9px; }
    input:focus-visible, select:focus-visible, button:focus-visible { outline: 3px solid rgba(224, 88, 79, .35); }
    button { cursor: pointer; background: #fff; }
    button.primary { background: rgb(224 88 79); border-color: rgb(224 88 79); color: white; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
    th, td { border-bottom: 1px solid #e5e5e5; padding: 6px; text-align: left; vertical-align: middle; }
    th { color: #666; font-size: 12px; line-height: 1.2; }
    td input, td select { width: 100%; min-width: 0; }
    th:nth-child(1) { width: 22%; }
    th:nth-child(2) { width: 10%; }
    th:nth-child(3) { width: 20%; }
    th:nth-child(4) { width: 16%; }
    th:nth-child(5) { width: 12%; }
    th:nth-child(6) { width: 20%; }
    .actions { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } table { display: block; overflow-x: auto; } }
  </style>
</head>
<body>
  <header>
    <h1>User Onboarding</h1>
    <p>
      <strong class="${environment === 'production' ? 'danger' : ''}">${environment.toUpperCase()}</strong>
      · ${escapeHtml(database)}
      · local only
    </p>
  </header>
  <main>
    ${message ? `<p class="message">${escapeHtml(message)}</p>` : ''}
    <form method="post" action="/create?token=${TOKEN}">
      <h2>Account</h2>
      <div class="grid">
        <label>Email <input name="email" type="email" autocomplete="off" spellcheck="false" required value="${escapeHtml(state.email)}" /></label>
        <label>Repeat Email <input name="emailRepeat" type="email" autocomplete="off" spellcheck="false" required value="${escapeHtml(state.emailRepeat)}" /></label>
        <label>Role
          <select name="role">
            <option value="PARENT"${state.role === 'PARENT' ? ' selected' : ''}>PARENT</option>
            <option value="TRAINER"${state.role === 'TRAINER' ? ' selected' : ''}>TRAINER</option>
          </select>
        </label>
      </div>

      <h2>Children & Results</h2>
      <table>
        <thead>
          <tr>
            <th>Child Name</th>
            <th>Birth Year</th>
            <th>Group</th>
            <th>Test Type</th>
            <th>Value</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody id="rows">
          ${Array.from({ length: rowCount })
            .map((_, index) => rowHtml(state.rows[index], groupOptions, testOptions))
            .join('')}
        </tbody>
      </table>
      <div class="actions">
        <button type="button" onclick="addRows()">Add 5 Rows</button>
      </div>

      <h2>Confirm</h2>
      <label>Type ${confirmation}
        <input name="confirmation" autocomplete="off" spellcheck="false" required value="${escapeHtml(state.confirmation)}" />
      </label>
      <div class="actions">
        <button class="primary" type="submit">Create User</button>
      </div>
    </form>
  </main>
  <script>
    const groupOptions = ${JSON.stringify(groupOptions)};
    const testOptions = ${JSON.stringify(testOptions)};
    function addRows() {
      const rows = document.getElementById('rows');
      for (let i = 0; i < 5; i++) {
        rows.insertAdjacentHTML('beforeend', '<tr><td><input name="childName" autocomplete="off" /></td><td><input name="birthYear" type="number" inputmode="numeric" /></td><td><select name="groupId">' + groupOptions + '</select></td><td><select name="testType"><option value="">No result</option>' + testOptions + '</select></td><td><input name="value" type="number" inputmode="decimal" step="0.01" /></td><td><input name="testedAt" type="date" autocomplete="off" /></td></tr>');
      }
    }
    document.querySelector('form').addEventListener('submit', (event) => {
      const form = event.currentTarget;
      const email = form.email.value.trim().toLowerCase();
      const emailRepeat = form.emailRepeat.value.trim().toLowerCase();
      const expected = ${JSON.stringify(confirmation)};
      if (email !== emailRepeat) {
        event.preventDefault();
        alert('Emails do not match.');
        form.emailRepeat.focus();
        return;
      }
      if (form.confirmation.value !== expected) {
        event.preventDefault();
        alert('Confirmation must be "' + expected + '".');
        form.confirmation.focus();
        return;
      }
      for (const row of document.querySelectorAll('#rows tr')) {
        const name = row.querySelector('[name="childName"]').value.trim();
        const resultType = row.querySelector('[name="testType"]').value;
        const value = row.querySelector('[name="value"]').value;
        const date = row.querySelector('[name="testedAt"]').value;
        if (!name && (resultType || value || date)) {
          event.preventDefault();
          alert('Child name is required when a result is entered.');
          row.querySelector('[name="childName"]').focus();
          return;
        }
        if (name && (resultType || value || date) && (!resultType || !value || !date)) {
          event.preventDefault();
          alert('Test type, value, and date are required together.');
          row.querySelector('[name="testType"]').focus();
          return;
        }
      }
    });
  </script>
</body>
</html>`;
}

async function pageFromParams(
  environment: TargetEnvironment,
  database: string,
  message: string,
  params: URLSearchParams
) {
  return pageWithRows(environment, database, message, {
    email: params.get('email') ?? '',
    emailRepeat: params.get('emailRepeat') ?? '',
    role: params.get('role') ?? 'PARENT',
    confirmation: params.get('confirmation') ?? '',
    rows: groupRows(params),
  });
}

function optionsWithSelection(options: string, selected: string) {
  if (!selected) return options;
  return options.replace(`value="${selected}"`, `value="${selected}" selected`);
}

function rowHtml(row: Row | undefined, groupOptions: string, testOptions: string) {
  const data = row ?? {
    name: '',
    birthYear: '',
    groupId: '',
    testType: '',
    value: '',
    testedAt: '',
  };

  return `<tr>
    <td><input name="childName" autocomplete="off" value="${escapeHtml(data.name)}" /></td>
    <td><input name="birthYear" type="number" inputmode="numeric" value="${escapeHtml(data.birthYear)}" /></td>
    <td><select name="groupId">${optionsWithSelection(groupOptions, data.groupId)}</select></td>
    <td><select name="testType"><option value="">No result</option>${optionsWithSelection(testOptions, data.testType)}</select></td>
    <td><input name="value" type="number" inputmode="decimal" step="0.01" value="${escapeHtml(data.value)}" /></td>
    <td><input name="testedAt" type="date" autocomplete="off" value="${escapeHtml(data.testedAt)}" /></td>
  </tr>`;
}

async function create(params: URLSearchParams, environment: TargetEnvironment) {
  const email = normalizeEmail(params.get('email') ?? '');
  const emailRepeat = normalizeEmail(params.get('emailRepeat') ?? '');
  const role = String(params.get('role') ?? '').toUpperCase();
  const confirmation = params.get('confirmation') ?? '';
  const expected = environment === 'production' ? 'CREATE PRODUCTION USER' : 'CREATE STAGING USER';

  if (email !== emailRepeat) throw new Error('Emails do not match.');
  if (!isUserRole(role)) throw new Error('Invalid role.');
  if (confirmation !== expected) throw new Error(`Confirmation must be "${expected}".`);

  const temporaryPassword = generateTemporaryPassword();
  const created = await createUserWithChildren({
    email,
    role,
    temporaryPassword,
    mustChangePassword: true,
    children: role === 'PARENT' ? rowsToChildren(groupRows(params)) : [],
  });

  return [
    'Created',
    `Email: ${created.user.email}`,
    `Role: ${created.user.role}`,
    `Children: ${created.childrenCount}`,
    `Results: ${created.resultsCount}`,
    `Temporary password: ${temporaryPassword}`,
  ].join('\n');
}

async function main() {
  const environment = getEnvironment();
  const database = describeDatabaseUrl(getDatabaseUrl());

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);
      if (url.searchParams.get('token') !== TOKEN) throw new Error('Invalid token.');

      if (req.method === 'POST' && url.pathname === '/create') {
        const params = await parseBody(req);
        let response;
        try {
          const message = await create(params, environment);
          response = send(200, await page(environment, database, message));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          response = send(400, await pageFromParams(environment, database, `Error: ${message}`, params));
        }
        res.writeHead(response.status, response.headers);
        res.end(response.body);
        return;
      }

      const response = send(200, await page(environment, database));
      res.writeHead(response.status, response.headers);
      res.end(response.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const response = send(400, await page(environment, database, `Error: ${message}`));
      res.writeHead(response.status, response.headers);
      res.end(response.body);
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`User onboarding UI (${environment})`);
    console.log(`Database: ${database}`);
    console.log(`Open: http://${HOST}:${PORT}/?token=${TOKEN}`);
    console.log('Press Ctrl+C to stop.');
  });

  process.on('SIGINT', () => {
    server.close(() => {
      void disconnectAdminPrisma().finally(() => process.exit(0));
    });
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});
