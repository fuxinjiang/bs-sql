import { Bench } from "@/entities/Bench";
import { Chart } from "@/entities/Chart";
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export default api;

export async function login(uuid: string) {
  const res = await api.post("/auth/login", { uuid });
  const token = res.data.token;

  api.defaults.headers.common["Authorization"] = `${token}`;

  return token;
}

export async function getBench(benchId: string) {
  const res = await api.get(`/benchBt/${benchId}`);
  return res.data as Bench;
}

export async function createBench(bench: Bench) {
  const res = await api.post(`/benchBt`, bench);
  return res.data as Bench;
}

export async function updateBench(benchId: string, bench: Partial<Bench>) {
  const res = await api.put(`/benchBt/${benchId}`, bench);
  return res.data as Bench;
}

export async function getChart(chartId: string) {
  const res = await api.get(`/chart/${chartId}`);
  return res.data as Chart;
}

export async function delChart(chartId: string) {
  const res = await api.delete(`/chart/${chartId}`);
  return res.data as Chart;
}
