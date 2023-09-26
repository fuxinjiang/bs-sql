import { useCallback, useState } from "react";
import { useBase } from "./useBase";
import { sqlFieldReplace } from "../utils/shared";
import alasql from "alasql";

export function useQuery() {
  const { fetchData, fieldsMapId, fieldsMapName } = useBase();
  const [result, setResult] = useState<any>();
  const [error, setError] = useState<any>();
  const [columns, setColumns] = useState<any>();
  const [pageSize, setPageSize] = useState<any>();
  const [total, setTotal] = useState<any>();

  const onExec = useCallback(
    async (sql: string, pageIndex: number, reset?: boolean) => {
      // console.log("onExec", sql, pageIndex);
      setError("");
      const { data, total, pageSize } = await fetchData(pageIndex, reset);
      setTotal(total);
      setPageSize(pageSize);
      let tsql = sqlFieldReplace(sql, fieldsMapId);
      try {
        const res = alasql(tsql, [data]); // select 功能模块 from ?
        // console.log(tsql, res);
        const columns = Object.keys(res[0] || {}).map((id) => {
          return {
            title: fieldsMapName[id] || id,
            width: 100,
            dataIndex: id,
            key: id,
          };
        });
        setColumns(columns);
        setResult(res);
      } catch (error) {
        console.error(error);
      }
    },
    [fetchData, fieldsMapId, fieldsMapName]
  );
  return {
    result,
    error,
    columns,
    onExec,
    pageSize,
    setPageSize,
    total,
  };
}
