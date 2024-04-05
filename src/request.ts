const api = import.meta.env.VITE_API;

const request = async (url: string, data = {}) => {
  try {
    const rawRes = await fetch(api + "/api/" + url, {
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
