const crypto = require("crypto");

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
};

const sign = (payload, secret) => {
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signaturePart = base64UrlEncode(
    crypto.createHmac("sha256", secret).update(payloadPart).digest()
  );
  return `${payloadPart}.${signaturePart}`;
};

const verify = (token, secret) => {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) {
    throw new Error("Invalid token format");
  }

  const expected = base64UrlEncode(
    crypto.createHmac("sha256", secret).update(payloadPart).digest()
  );

  const provided = Buffer.from(signaturePart);
  const expectedBuf = Buffer.from(expected);

  if (
    provided.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(provided, expectedBuf)
  ) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(payloadPart));

  if (!payload.exp || Date.now() > payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
};

const issueAuthToken = (userId, secret) =>
  sign(
    {
      sub: userId,
      exp: Date.now() + TOKEN_TTL_MS,
    },
    secret
  );

module.exports = {
  issueAuthToken,
  verify,
};
