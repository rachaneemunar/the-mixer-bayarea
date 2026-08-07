exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
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

    const data = JSON.parse(event.body || "{}");

    const name = data.name || "";
    const email = data.email || "";
    const enjoyedMost = data.enjoyedMost || "";
    const couldImprove = data.couldImprove || "";
    const futureTopics = data.futureTopics || "";
    const wouldRecommend = data.wouldRecommend || "";
    const source = data.source || "feedback";

    if (!name.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Name is required."
        })
      };
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Please enter a valid email address."
        })
      };
    }

    // The feedback form has one "Name" field, but Brevo stores FIRSTNAME
    // and LASTNAME separately, so split on the first space.
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ");

    const attributes = {
      FEEDBACK_ENJOYED: enjoyedMost.trim(),
      FEEDBACK_IMPROVE: couldImprove.trim(),
      FEEDBACK_TOPICS: futureTopics.trim(),
      FEEDBACK_RECOMMEND: wouldRecommend.trim(),
      FEEDBACK_SOURCE: source,
      FEEDBACK_DATE: new Date().toISOString().slice(0, 10)
    };

    // Only set name fields when we actually have them, so an existing
    // contact's good name is never overwritten with an empty string.
    if (firstName) {
      attributes.FIRSTNAME = firstName;
    }

    if (lastName) {
      attributes.LASTNAME = lastName;
    }

    const payload = {
      email: email.trim(),
      attributes: attributes,
      updateEnabled: true
    };

    // Optional. Set BREVO_FEEDBACK_LIST_ID in Netlify only if you want
    // feedback submitters added to a list. Left unset, they are still
    // saved to your contact database.
    if (process.env.BREVO_FEEDBACK_LIST_ID) {
      payload.listIds = [Number(process.env.BREVO_FEEDBACK_LIST_ID)];
    }

    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const brevoResult = await brevoResponse.json().catch(function () {
      return {};
    });

    if (!brevoResponse.ok) {
      console.error("Brevo feedback error:", brevoResult);

      return {
        statusCode: brevoResponse.status,
        headers,
        body: JSON.stringify({
          error: brevoResult.message || "Brevo feedback submission failed. Please try again."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Thank you. Your feedback has been received."
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
