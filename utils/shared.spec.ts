import { sqlFieldReplace } from "./shared";

describe("shared.ts", () => {
  it("should sqlFieldReplace", () => {
    expect(
  sqlFieldReplace(
    `select 模块, count(模块) as c from ? where 模块='模块' group by 模块 order by c desc`,
    {
      模块: "mod"
    }
  )
).toMatchInlineSnapshot(`"select mod, count(mod) as c from ? where mod='模块' group by mod order by c desc"`);
  });
});
