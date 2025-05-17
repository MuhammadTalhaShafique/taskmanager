import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_BASE_URL || "http://13.61.124.69:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to headers if it exists in localStorage
const token = localStorage.getItem("token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default api;
