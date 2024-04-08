const host = import.meta.env.VITE_HOST;
const path = import.meta.env.VITE_PATH;
const port = import.meta.env.VITE_PORT;
const secure = import.meta.env.VITE_SECURE === "true" ? "https://" : "http://";

const request = async (url: string, data = {}) => {
  try {
    const rawRes = await fetch(secure + host + ":" + port + path + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const res = rawRes.json();
    return res;
  } catch (e) {
    console.error(e);
  }
};

export default request;
