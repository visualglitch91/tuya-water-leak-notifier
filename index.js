const { TuyaContext } = require("@tuya/tuya-connector-nodejs");
const request = require("request");

const {
  tuyaAPI: { baseUrl, accessKey, secretKey },
  devices,
} = require("./config.json");

const context = new TuyaContext({
  baseUrl,
  accessKey,
  secretKey,
});

const state = {};

async function getDeviceStatus(deviceId) {
  const response = await context.request({
    method: "GET",
    path: `/v1.0/devices/${deviceId}/status`,
  });

  if (!response.success) {
    return "offline";
  }

  return (
    response.result.find((it) => it.code === "watersensor_state")?.value ||
    "offline"
  );
}

async function loop() {
  await Promise.all(
    devices.map(async (config) => {
      const current = {
        ...config,
        status: await getDeviceStatus(config.id),
      };

      const prev = state[config.id];

      if (current.status !== prev?.status) {
        state[config.id] = current;

        if (current.status === "alarm") {
          request.post(config.alarmWebhook);
        }
      }
    })
  );

  console.log(state);
  setTimeout(loop, 3_000);
}

loop();
