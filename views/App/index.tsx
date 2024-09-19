import { Banner, Button, Col, Dropdown, Form, Input, Progress, Row, Spin, Table, Toast } from "@douyinfe/semi-ui";
import { useState, useEffect, useRef, useCallback } from "react";
import { PermissionEntity, OperationType, bitable, IFieldMeta, ITableMeta } from "@lark-base-open/js-sdk";
import styles from "./index.module.css";
import { useQuery } from "../../utils/useQuery";
import { ColumnProps, TablePagination } from "@douyinfe/semi-ui/lib/es/table";
import Icon, { IconAscend, IconExport, IconGithubLogo, IconLink } from "@douyinfe/semi-icons";
import type { TableColumnProperties } from "exceljs";
import { message } from "antd";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

// 定义 Text2SQL 输入接口信息
interface Column {
  name: string;
  type: string;
  is_primary: boolean;
}

interface Tables {
  name: string;
  columns: Column[];
}

interface DbMetadata {
  db_id: string;
  tables: Tables[];
}

interface RequestPayload {
  request_id: string;
  query: string;
  external_knowledge: string[];
  model: string;
  stream: boolean;
  use_explanation: boolean;
  use_fallback: boolean;
  use_validator: boolean;
  db_metadata: DbMetadata;
}

// 提取db schema information
async function getMeta(params: { t: TFunction<"translation", undefined> }) {
  const { t } = params;
  const { tableId } = await bitable.base.getSelection();
  if (!tableId) {
    message.error(t('获取数据表为空'));
    throw new Error('获取数据表错误');
  }
  const table = await bitable.base.getTableById(tableId);
  const fieldMetaList = await table.getFieldMetaList();
  const tableMeta = await table.getMeta();
  const tableMetaList = await bitable.base.getTableMetaList();

  return {
    tableMeta,
    tableMetaList,
    fieldMetaList,
  };
}

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
  const ExcelJS = await import("exceljs/dist/exceljs");
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
  const [sql, setSql] = useState('');
  const [query, setQuery] = useState<string>("查询所有数据");
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const input = useRef('');
  // const [loading, setLoading] = useState(false);
  const [result_sql, setResult] = useState('');
  const baseInfo = useRef<{
    tableMeta: ITableMeta;
    tableMetaList: ITableMeta[];
    fieldMetaList: IFieldMeta[];
  }>();

  // 获取线上db信息
  const getInfo = async () => {
    const info = await getMeta({ t });
    baseInfo.current = info;
    return info;
  };

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
  const onChange = useCallback((val: string) => setQuery(val), []);
  const onQuery = useCallback(async () => {
    if (loading) {
      Toast.warning({
        content: "querying...",
      });
      return;
    }
    setLoading(true);
    setCurrentPage(1);
    const info = await getInfo();

    // TODO: type暂时还没有进行额外映射，后续处理
    const columns = info.fieldMetaList.map(item => ({
      name: item.name,
      type: "TEXT",
      is_primary: item.isPrimary
    }));

    const requestData: RequestPayload = {
      request_id: "",
      query: query,
      external_knowledge: [],
      model: "lab-sql-optimized-20240426",
      stream: false,
      use_explanation: true,
      use_fallback: false,
      use_validator: false,
      db_metadata: {
        db_id: "",
        tables: [
          {
            name: info.tableMeta.name,
            columns: columns
          }
        ]
      }
    };

    const data = await callApi(requestData);
    // 前端输出返回结果
    const sql = String(data.sql)
    setSql(sql);
    console.log("调用bytebrain nl2sql, 生成sql为:", sql)
    await onExec(sql, -1, true);
    setLoading(false);
  }, [loading, onExec, query]);

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
    const bool = await bitable.base.getPermission({
      entity: PermissionEntity.Base,
      type: OperationType.Printable,
    });
    if (!bool) {
      Toast.warning({
        content: "no permission",
      });
      return;
    }
    if (exportLoading) {
      Toast.warning({
        content: "exporting...",
      });
      return;
    }
    setExportLoading(true);
    try {
      const res = await exec(query, -1);
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
  }, [exec, exportLoading, query]);
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
          <Input defaultValue={query} onChange={onChange}></Input>
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
                {(<><Dropdown.Item
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
                </Dropdown.Item></>) as any}
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
      {sql ? <Row style={{ margin: "0.6rem", padding: '0.5rem', fontSize: '14px', border: '1px solid', whiteSpace: 'pre-wrap' }}>{sql}</Row> : null}
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

const callApi = async (payload: RequestPayload) => {
  try {
    console.log("输入数据,", JSON.stringify(payload))
    const response = await fetch('https://bytebrain.bytedance.net/openapi/lark/text2sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      // mode: 'no-cors', // 添加这一行
    });
    const text = await response.json()
    console.log("输出数据,", text)
    return text;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};