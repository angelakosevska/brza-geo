import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "mk", // or dynamically set
  },
});

export default api;
