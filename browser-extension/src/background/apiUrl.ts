function getAPIUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4000";
  } else if (process.env.NODE_ENV === "production") {
    return "https://rust.alsvik.cloud";
  }
  throw new Error("Failed to get API URL because NODE_ENV was not set.");
}

export const API_URL = getAPIUrl();
