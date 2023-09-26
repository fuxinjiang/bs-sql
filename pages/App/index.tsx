"use client";
import alasql from "alasql";
import type { IFieldMeta, IGetRecordsResponse } from "@lark-base-open/js-sdk";
import {
  Banner,
  Button,
  Col,
  Dropdown,
  Form,
  Input,
  Progress,
  Row,
  Spin,
  Table,
  Toast,
} from "@douyinfe/semi-ui";
import { useState, useEffect, useRef, useCallback } from "react";
import { BaseFormApi } from "@douyinfe/semi-foundation/lib/es/form/interface";
import styles from "./index.module.css";
import { sqlFieldReplace } from "../../utils/shared";
import { useQuery } from "../useQuery";
import { ColumnProps, TablePagination } from "@douyinfe/semi-ui/lib/es/table";
import Icon, {
  IconAscend,
  IconExport,
  IconGithubLogo,
  IconLink,
} from "@douyinfe/semi-icons";
import ExcelJS, { TableColumnProperties } from "exceljs";

function downloadBufferAsFile(buffer: ArrayBuffer, fileName: string) {
  // 创建一个新的 Blob 对象，将 buffer 数据放入其中
  const blob = new Blob([buffer]);

  // 创建一个 URL 对象，用于生成下载链接
  const url = URL.createObjectURL(blob);

  // 打开下载链接
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // 清理资源
  URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

function tableToMatrix(
  columns: ColumnProps<any>[],
  data: any[]
): [TableColumnProperties[], any[]] {
  const tdata: any[] = [];
  const tcolumns: TableColumnProperties[] = columns.map(
    (c) =>
      ({
        name: c.title,
      } as TableColumnProperties)
  );
  for (let i = 0; i < data.length; i++) {
    const d: any = data[i];
    const row = [];
    for (let j = 0; j < columns.length; j++) {
      const c = columns[j];
      const k = c.key as any;
      row.push(d[k]);
    }
    tdata.push(row);
  }

  return [tcolumns, tdata];
}

async function exportXls(
  filename: string,
  columns: TableColumnProperties[],
  rows: any[]
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");
  // 将表格添加到工作表
  worksheet.addTable({
    name: "Sheet1",
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: {
      // theme: "TableStyleDark3",
      showRowStripes: true,
      showFirstColumn: true,
    },
    columns,
    rows,
    // columns: [{ name: "Id" }, { name: "Name" }, { name: "D.O.B." }],
    // rows: [
    //   [6, "Barbara", new Date()],
    //   [6, "Barbara", new Date()],
    //   [6, "Barbara", new Date()],
    // ],
  });

  worksheet.columns.forEach((item) => (item.width = 10));

  // add new rows and return them as array of row objects
  const buf = await workbook.xlsx.writeBuffer();
  downloadBufferAsFile(buf, filename);
}

export default function App() {
  const [sql, setSql] = useState<string>("select * from ?");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    exec,
    onExec,
    error,
    pageSize = 0,
    total = 0,
    columns,
    result,
  } = useQuery();
  const [loading, setLoading] = useState(false);

  const onChange = useCallback((val: string) => setSql(val), []);
  const onQuery = useCallback(async () => {
    if (loading) {
      Toast.warning({
        content: "querying...",
      });
      return;
    }
    setLoading(true);
    setCurrentPage(1);
    await onExec(sql, 0, true);
    setLoading(false);
  }, [loading, onExec, sql]);

  const pagination: TablePagination =
    pageSize >= total
      ? false
      : {
          currentPage: currentPage,
          size: "small",
          pageSize,
          total,
          position: "top",
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
  const [exportLoading, setExportLoading] = useState(false);
  const onExport = useCallback(async () => {
    if (exportLoading) {
      Toast.warning({
        content: "exporting...",
      });
      return;
    }
    setExportLoading(true);
    try {
      const res = await exec(sql, -1);
      // console.log(res);
      exportXls(
        res.tableName + ".xlsx",
        ...tableToMatrix(res.columns, res.result)
      );
    } catch (error) {
      console.error(error);
      Toast.error({
        content: `export error: ${error}`,
      });
    }
    setExportLoading(false);
  }, [exec, exportLoading, sql]);
  const onHelp = useCallback(() => {
    window.open("http://sqlmother.yupi.icu/#/learn");
  }, []);
  const onGithub = useCallback(() => {
    window.open("https://github.com/WumaCoder/bs-sql");
  }, []);
  return (
    <main className={styles.main}>
      <Row style={{ padding: "0.5rem" }}>
        <Col span={18}>
          <Input defaultValue={sql} onChange={onChange}></Input>
        </Col>
        <Col span={4} style={{ paddingLeft: "5px" }}>
          <Button type="primary" block theme="solid" onClick={onQuery}>
            Query
          </Button>
        </Col>
        <Col span={2} style={{ paddingLeft: "5px" }}>
          <Dropdown
            trigger={"click"}
            position={"bottomRight"}
            render={
              <Dropdown.Menu>
                <Dropdown.Item
                  icon={exportLoading ? <Spin /> : <IconExport />}
                  onClick={onExport}
                >
                  Export
                </Dropdown.Item>
                <Dropdown.Item icon={<IconLink />} onClick={onHelp}>
                  Help
                </Dropdown.Item>
                <Dropdown.Item icon={<IconGithubLogo />} onClick={onGithub}>
                  Github
                </Dropdown.Item>
                {/* <Dropdown.Item>Menu Item 2</Dropdown.Item>
                <Dropdown.Item>Menu Item 3</Dropdown.Item> */}
              </Dropdown.Menu>
            }
          >
            <Button icon={<IconAscend />}></Button>
          </Dropdown>
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
