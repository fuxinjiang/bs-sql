import { useEffect } from "react";
import type { IFieldMeta, IGetRecordsResponse } from "@lark-base-open/js-sdk";

let fieldsMapName: any = {};
let fieldsMapId: any = {};
let pageTokens = new Map();
let hasMore = true;
let pageSize = 500;
let total = 0;
async function fetchData(
  pageNum = 0,
  reset?: boolean
): Promise<{
  hasMore: boolean;
  pageSize: number;
  total: number;
  data: any[];
}> {
  const { bitable } = await import("@lark-base-open/js-sdk");
  if (reset) {
    pageTokens.clear();
    hasMore = true;
  }

  const selection = await bitable.base.getSelection();
  if (!selection?.tableId) throw new Error("sdk error");
  const table = await bitable.base.getTableById(selection.tableId);
  const fields = await table.getFieldMetaList();
  const pageToken = pageTokens.get(pageNum);
  console.log("pageToken", pageToken, pageTokens);
  const res = await table.getRecords({
    pageSize: pageSize,
    pageToken: pageToken,
  });
  console.log("data:", res);
  const data = transData(res, fields);
  console.log("trans:", data);
  hasMore = res.hasMore;
  pageTokens.set(pageNum + 1, res.pageToken);
  if (pageNum === 0) {
    total = res.total;
  }
  return {
    hasMore,
    pageSize,
    total,
    data,
  };
}

function transData(data: IGetRecordsResponse, fields: IFieldMeta[]) {
  const res = data.records.map((record) => {
    const obj: any = {};
    fields.forEach((field) => {
      const cell = record.fields[field.id] as any;
      fieldsMapName[field.id] = field.name;
      fieldsMapId[field.name] = field.id;
      obj[field.id] =
        typeof cell === "object"
          ? cell?.text ??
            cell?.map?.((item: any) => item.text ?? item.name).join(",")
          : cell;
    });
    return obj;
  });
  return res;
}

export function useBase() {
  return {
    fetchData,
    fieldsMapName,
    fieldsMapId,
  };
}
