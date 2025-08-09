import axios from "axios";

export const nodeBackend = axios.create({ baseURL: "http://localhost:5000/" });
export const cpabe = axios.create({ baseURL: "http://localhost:8000/" });

