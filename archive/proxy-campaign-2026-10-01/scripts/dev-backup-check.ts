import { backupTestData } from "../lib/admin/test-data";
const result = await backupTestData("operator-backup-check", false);
console.log(
  JSON.stringify({
    count: result.count,
    backupKey: result.backupKey,
    sha256: result.sha256,
    cleared: result.cleared,
  }),
);
