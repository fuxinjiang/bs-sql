import { useCallback, useState } from "react";
import { useBase } from "./useBase";
import { sqlFieldReplace } from "../utils/shared";
import alasql from "alasql";

export function useQuery() {
  const { fetchData, fetchDataAll, fieldsMapId, fieldsMapName } = useBase();
  const [result, setResult] = useState<any>();
  const [error, setError] = useState<any>();
  const [columns, setColumns] = useState<any>();
  const [pageSize, setPageSize] = useState<any>();
  const [total, setTotal] = useState<any>();

  const exec = useCallback(
    async (sql: string, pageIndex: number, reset?: boolean) => {
      const { data, total, pageSize, hasMore, tableName } =
        pageIndex === -1
          ? await fetchDataAll()
          : await fetchData(pageIndex, reset);
      let tsql = sqlFieldReplace(sql, fieldsMapId);
      const result = alasql(tsql, [data]); // select 功能模块 from ?
      // console.log(tsql, res);
      const columns = Object.keys(result[0] || {}).map((id) => {
        return {
          title: fieldsMapName[id] || id,
          width: 100,
          dataIndex: id,
          key: id,
        };
      });
      return {
        tableName,
        columns,
        result,
        total,
        pageSize,
        hasMore,
      };
    },
    [fetchData, fetchDataAll, fieldsMapId, fieldsMapName]
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
    fetchData,
    fieldsMapId,
    fieldsMapName,
  };
}
