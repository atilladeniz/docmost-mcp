import axios from "axios";

const baseURL = process.env.MCP_SERVER_URL || "http://localhost:3000/api";
const apiKey = process.env.MCP_API_KEY;

if (!apiKey) {
  throw new Error("MCP_API_KEY environment variable is required");
}

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API Error: No response received", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);
