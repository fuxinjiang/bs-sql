export function sqlFieldReplace(sql: string, replace: Record<string, string>) {
  const keys = Object.keys(replace).sort((a, b) => b.length - a.length);
  const reg = /([^\w,()?= ]+)/gm;
  return sql.replace(reg, (match, p1) => {
    const trimmedMatch = match.trim();
    const replacement = replace[trimmedMatch];
    return replacement || match;
  });
}
