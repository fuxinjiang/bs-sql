import { useCallback, useState } from "react";
import { BsSdk } from "../libs/bs-sdk/BsSdk";
import { BsSql } from "../libs/bs-sql";

const bsSdk = new BsSdk({});
const bsSQL = new BsSql(bsSdk);

export function useQuery() {
  const [result, setResult] = useState<any>();
  const [error, setError] = useState<any>();
  const [columns, setColumns] = useState<any>();
  const [pageSize, setPageSize] = useState<any>();
  const [total, setTotal] = useState<any>();

  const exec = useCallback(
    async (sql: string, pageIndex: number, reset?: boolean) => {
      const result = await bsSQL.query(sql);
      const [tableListCtx] = await bsSQL.emFetchTableList.wait();
      const [tableFields] = await bsSQL.emFetchTableListFields.wait();
      const fieldIdMapName = new Map<string, string>();
      tableFields.forEach((t: any) => {
        Object.keys(t.fieldsMapId).forEach((id) => {
          fieldIdMapName.set(id, t.fieldsMapId[id]);
        });
      });
      const columns = Object.keys(result[0] || {})
        .filter((item) => !["_id", "_raw_"].includes(item))
        .map((id) => {
          return {
            title: fieldIdMapName.get(id) || id,
            width: 100,
            dataIndex: id,
            key: id,
          };
        });
      return {
        tableName: await tableListCtx.tableList[0].getName(),
        columns,
        result,
        total,
        pageSize,
      };
    },
    []
  );

  const onExec = useCallback(
    async (sql: string, pageIndex: number, reset?: boolean) => {
      // console.log("onExec", sql, pageIndex);
      setError("");
      try {
        const { columns, result, total, pageSize } = await exec(
          sql,
          pageIndex,
          reset
        );
        setTotal(total);
        setPageSize(pageSize);
        setColumns(columns);
        setResult(result);
      } catch (error) {
        console.error(error);
        setError(String(error));
      }
    },
    [exec]
  );

  return {
    result,
    error,
    columns,
    exec,
    onExec,
    pageSize,
    setPageSize,
    total,
  };
}
