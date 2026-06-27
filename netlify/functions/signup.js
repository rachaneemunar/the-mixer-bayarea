exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed." })
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    // Hidden anti-spam honeypot. Real visitors should never fill this field.
    if (data.website) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    const email = String(data.email || "").trim().toLowerCase();
    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const profession = String(data.profession || "").trim();
    const phone = String(data.phone || "").trim();
    const address = String(data.address || "").trim();
    const consent = data.newsletter === "on" || data.newsletter === true || data.consent === true;

    if (!firstName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Please enter your first name." }) };
    }

    if (!lastName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Please enter your last name." }) };
    }

    if (!profession) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Please enter your profession." }) };
    }

    if (!phone) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Please enter your phone number." }) };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Please enter a valid email address." }) };
    }

    if (!consent) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Please confirm consent before subscribing." }) };
    }

    const listId = Number(process.env.BREVO_LIST_ID);

    if (!process.env.BREVO_API_KEY || !listId) {
      console.error("Missing BREVO_API_KEY or BREVO_LIST_ID environment variable.");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Signup is not configured yet. Please contact the site owner." })
      };
    }

    const attributes = {
      FIRSTNAME: firstName,
      LASTNAME: lastName,
      PROFESSION: profession,
      PHONE: phone
    };

    if (address) attributes.ADDRESS = address;

    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [listId],
        updateEnabled: true
      })
    });

    const brevoResult = await brevoResponse.json().catch(() => ({}));

    if (!brevoResponse.ok) {
      console.error("Brevo API error:", brevoResult);
      return {
        statusCode: brevoResponse.status,
        headers,
        body: JSON.stringify({
          error: brevoResult.message || "Could not complete registration. Please try again."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Thank you. You are registered."
      })
    };
  } catch (error) {
    console.error("Signup function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Something went wrong. Please try again." })
    };
  }
};
