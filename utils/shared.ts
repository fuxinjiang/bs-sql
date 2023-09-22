export function sqlFieldReplace(sql: string, replace: Record<string, string>) {
  const keys = Object.keys(replace).sort((a, b) => b.length - a.length);
  const reg = /([^\s,?= ]+)/gm;
  return sql.replace(reg, (match, p1) => {
    const trimmedMatch = match.trim();
    const replacement = replace[trimmedMatch] ?? replace[p1];
    if (
      !replacement &&
      trimmedMatch.includes("(") &&
      trimmedMatch.includes(")")
    ) {
      return trimmedMatch.replace(/\((.+)\)/gm, (match, p1) => {
        const replacement = replace[p1];
        return `(${replacement || p1})`;
      });
    }
    return replacement || match;
  });
}
