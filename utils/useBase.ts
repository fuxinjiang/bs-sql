import { useEffect } from "react";
import type { IFieldMeta, IGetRecordsResponse } from "@lark-base-open/js-sdk";

let fieldsMapName: any = {};
let fieldsMapId: any = {};
let pageTokens = new Map();
let hasMore = true;
let pageSize = 2000;
let total = 0;
let selection: any;
let table: any;
let fields: any;
async function fetchData(pageNum = 0, reset?: boolean) {
  const { bitable } = await import("@lark-base-open/js-sdk");
  if (reset) {
    pageTokens.clear();
    hasMore = true;
    selection = undefined;
    table = undefined;
    fields = undefined;
  }

  selection = selection ?? (await bitable.base.getSelection());
  if (!selection?.tableId) throw new Error("sdk error");
  table = table ?? (await bitable.base.getTableById(selection.tableId));
  fields = fields ?? (await table.getFieldMetaList());
  const pageToken = pageTokens.get(pageNum);
  // console.log("pageToken", pageToken, pageTokens);
  const res = await table.getRecords({
    pageSize: pageSize,
    pageToken: pageToken,
  });
  // console.log("data:", res);
  const data = transData(res, fields);
  // console.log("trans:", data);
  hasMore = res.hasMore;
  pageTokens.set(pageNum + 1, res.pageToken);
  if (pageNum === 0) {
    total = res.total;
  }
  return {
    tableName: await table.getName(),
    hasMore,
    pageSize,
    total,
    data,
  };
}

async function fetchDataAll() {
  let data: any[] = [];
  let hasMore: boolean = false;
  let pageSize: number = 0;
  let total: number = 0;
  let tableName: string = "";

  for (let i = 0; i < 100; i++) {
    const { data: data2, ...t } = await fetchData(i, i === 0);
    data = data.concat(data2);
    hasMore = t.hasMore;
    pageSize = t.total;
    total = t.total;
    tableName = t.tableName;
    if (!hasMore) {
      break;
    }
  }

  return {
    data,
    hasMore,
    pageSize,
    total,
    tableName,
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
    fetchDataAll,
  };
}
