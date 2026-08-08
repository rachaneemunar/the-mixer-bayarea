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
      body: JSON.stringify({
        error: "Method not allowed. This function only accepts form submissions."
      })
    };
  }

  try {
    if (!process.env.BREVO_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Missing BREVO_API_KEY in Netlify environment variables."
        })
      };
    }

    if (!process.env.BREVO_LIST_ID) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Missing BREVO_LIST_ID in Netlify environment variables."
        })
      };
    }

    const data = JSON.parse(event.body || "{}");

    const firstName = data.firstName || "";
    const lastName = data.lastName || "";
    const profession = data.profession || "";
    const company = data.company || "";
    const phone = data.phone || "";
    const email = data.email || "";
    const address = data.address || "";

    if (!firstName.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "First name is required." })
      };
    }

    if (!lastName.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Last name is required." })
      };
    }

    if (!profession.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Profession is required." })
      };
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Please enter a valid email address." })
      };
    }

    // BREVO_LIST_ID accepts one ID ("32") or several, comma-separated ("3,32").
    // Non-digits are stripped, so "#3, #32" works too.
    const listIds = process.env.BREVO_LIST_ID
      .split(",")
      .map(function (id) {
        return Number(String(id).replace(/[^0-9]/g, ""));
      })
      .filter(function (id) {
        return Number.isInteger(id) && id > 0;
      });

    if (listIds.length === 0) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "BREVO_LIST_ID is not a valid list ID or comma-separated list of IDs."
        })
      };
    }

    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email.trim(),
        attributes: {
          FIRSTNAME: firstName.trim(),
          LASTNAME: lastName.trim(),
          PROFESSION: profession.trim(),
          COMPANY: company.trim(),
          PHONE: phone.trim(),
          ADDRESS: address.trim()
        },
        listIds: listIds,
        updateEnabled: true
      })
    });

    const brevoResult = await brevoResponse.json().catch(function () {
      return {};
    });

    if (!brevoResponse.ok) {
      console.error("Brevo signup error:", brevoResult);

      return {
        statusCode: brevoResponse.status,
        headers,
        body: JSON.stringify({
          error: brevoResult.message || "Brevo signup failed. Please try again."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Thank you. You are signed up."
      })
    };
  } catch (error) {
    console.error("Netlify function error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Something went wrong. Please try again."
      })
    };
  }
};
