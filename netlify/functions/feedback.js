exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const data = JSON.parse(event.body);

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY, // stored as an env var, never in code
    },
    body: JSON.stringify({
      email: data.email,
      updateEnabled: true, // updates the contact if this email already exists
      attributes: {
        FIRSTNAME: data.name,
        FEEDBACK_ENJOYED: data.enjoyed,
        FEEDBACK_IMPROVE: data.improve,
        FEEDBACK_TOPICS: data.topics,
        FEEDBACK_RECOMMEND: data.recommend,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return { statusCode: 500, body: err };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
