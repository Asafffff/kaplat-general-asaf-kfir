const axios = require("axios");

const config = {
  protocol: "http",
  baseUrl: "localhost",
  port: 8989,
  myId: 208543702,
  myYoB: 1997,
};

const url = `${config.protocol}://${config.baseUrl}:${config.port}`;

const main = async () => {
  const getRequestRes = await axios.get(`${url}/test_get_method`, {
    params: {
      id: config.myId,
      year: config.myYoB,
    },
  });

  const postRequestRes = await axios.post(`${url}/test_post_method`, {
    id: config.myId,
    year: config.myYoB,
    requestId: getRequestRes.data,
  });

  const putRequestRes = await axios.put(
    `${url}/test_put_method`,
    {
      id: (config.myId - 294_234) % 34,
      year: (config.myYoB + 94) % 13,
    },
    {
      params: {
        id: postRequestRes.data.message,
      },
    }
  );

  const deleteRequestRes = await axios.delete(`${url}/test_delete_method`, {
    params: {
      id: putRequestRes.data.message,
    },
  });
};

main();
