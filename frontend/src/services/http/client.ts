import axios from "axios";

const defaultBaseURL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : import.meta.env.DEV
    ? "http://127.0.0.1:3000"
    : "/api";

export const httpClient = axios.create({
  baseURL: defaultBaseURL,
  timeout: 30_000
});
