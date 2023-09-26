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
import { useQuery } from "../useQuery";
import { TablePagination } from "@douyinfe/semi-ui/lib/es/table";

export default function App() {
  const [sql, setSql] = useState<string>("select * from ?");
  const [currentPage, setCurrentPage] = useState(1);

  const { onExec, error, pageSize, total, columns, result } = useQuery();

  const onChange = useCallback((val: string) => setSql(val), []);
  const onQuery = useCallback(() => {
    setCurrentPage(1);
    onExec(sql, 0, true);
  }, [onExec, sql]);

  const [loading, setLoading] = useState(false);
  const pagination: TablePagination =
    pageSize > total
      ? false
      : {
          currentPage: currentPage,
          size: "small",
          pageSize,
          total,
          hideOnSinglePage: true,
          formatPageText: (p) =>
            `当前 SQL 查询的是 ${p?.currentStart}条 到 ${p?.currentEnd}条 的数据`,
          onPageChange: async (page: number) => {
            // console.log("onPageChange", page);
            setLoading(true);
            setCurrentPage(page);
            await onExec(sql, page - 1, false);
            setLoading(false);
          },
        };

  return (
    <main className={styles.main}>
      <Row style={{ padding: "0.5rem" }}>
        <Col span={20}>
          <Input defaultValue={sql} onChange={onChange}></Input>
        </Col>
        <Col span={4} style={{ paddingLeft: "5px" }}>
          <Button type="primary" block theme="solid" onClick={onQuery}>
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
        <Table
          columns={columns}
          dataSource={result}
          pagination={pagination}
          loading={loading}
        />
      </div>
    </main>
  );
}
