"use client";
import alasql from "alasql";
import type { IFieldMeta, IGetRecordsResponse } from "@lark-base-open/js-sdk";
import {
  Banner,
  Button,
  Col,
  Form,
  Input,
  Row,
  Table,
} from "@douyinfe/semi-ui";
import { useState, useEffect, useRef, useCallback } from "react";
import { BaseFormApi } from "@douyinfe/semi-foundation/lib/es/form/interface";
import styles from "./index.module.css";
import { sqlFieldReplace } from "../../utils/shared";

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

let tableData: any = [];
let fieldsMapName: any = {};
let fieldsMapId: any = {};

export default function App() {
  const [sql, setSql] = useState<string>("select * from ?");
  const [result, setResult] = useState<any>();
  const [error, setError] = useState<any>();
  const [columns, setColumns] = useState<any>();
  const onClick = useCallback(async () => {
    console.log(sql);
    setError("");
    let tsql = sqlFieldReplace(sql, fieldsMapId);
    try {
      const res = alasql(tsql, [tableData]); // select 功能模块 from ?
      console.log(tsql, res);
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
      setError(String(error));
    }
  }, [sql]);
  const onChange = useCallback((val: string) => {
    console.log("sql", val);

    setSql(val);
  }, []);
  useEffect(() => {
    (async () => {
      console.log("请求表格数据");
      const { bitable } = await import("@lark-base-open/js-sdk");
      const selection = await bitable.base.getSelection();
      if (!selection?.tableId) return;
      const table = await bitable.base.getTableById(selection.tableId);
      const fields = await table.getFieldMetaList();
      const res = await table.getRecords({ pageSize: 1000 });
      console.log("data:", res);
      const jsonData = transData(res, fields);
      console.log("trans:", jsonData);
      tableData = jsonData;
    })();
  }, []);

  return (
    <main className={styles.main}>
      <Row style={{ padding: "0.5rem" }}>
        <Col span={20}>
          <Input defaultValue={sql} onChange={onChange}></Input>
        </Col>
        <Col span={4} style={{ paddingLeft: "5px" }}>
          <Button type="primary" block theme="solid" onClick={onClick}>
            Query
          </Button>
        </Col>
      </Row>
      {error && (
        <div style={{ margin: "0px 0.5rem" }}>
          <Banner
            fullMode={false}
            type="warning"
            bordered
            description={
              <p
                style={{
                  whiteSpace: "pre-wrap",
                  color: "red",
                  wordSpacing: "0.5em",
                }}
              >
                {error}
              </p>
            }
          ></Banner>
        </div>
      )}
      <div>
        <Table columns={columns} dataSource={result} pagination={false} />
      </div>
    </main>
  );
}
