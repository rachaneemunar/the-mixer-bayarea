/* =====================================================================
   The Mixer  —  Brevo signup Netlify Function

   Receives a JSON POST from the registration form and creates (or
   updates) a contact in Brevo, adding them to the list specified by
   BREVO_LIST_ID. Configure both env vars in Netlify:
     - BREVO_API_KEY  (your xkeysib-… key)
     - BREVO_LIST_ID  (numeric ID of the list to add signups to)

   Endpoint paths (both work):
     POST /.netlify/functions/signup
     POST /api/signup           (via netlify.toml redirect)
   ===================================================================== */

exports.handler = async (event) => {
  // 1. Only POST is allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // 2. Parse incoming JSON
  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  const {
    name = '',
    profession = '',
    company = '',
    phone = '',
    email = '',
    address = '',
    linkedin = '',
    facebook = '',
    instagram = '',
    youtube = '',
    website = '',
  } = data;

  // 3. Validate required fields (same set as the front-end "required" attrs)
  if (!name || !profession || !company || !phone || !email) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields.' }),
    };
  }

  // 4. Check env vars exist
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_LIST_ID) {
    console.error('Missing BREVO_API_KEY or BREVO_LIST_ID env vars');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server not configured. Please email viv@vabrato.com.' }),
    };
  }

  // 5. Split full name into first/last for Brevo
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName  = parts.slice(1).join(' ') || '';

  // 6. Build Brevo contact payload. updateEnabled:true means duplicate
  //    emails update the existing contact instead of erroring out.
  const payload = {
    email: email.trim().toLowerCase(),
    updateEnabled: true,
    listIds: [Number(process.env.BREVO_LIST_ID)],
    attributes: {
      FIRSTNAME:   firstName,
      LASTNAME:    lastName,
      PROFESSION:  profession,
      COMPANY:     company,
      SMS:         phone,        // Brevo's built-in SMS attribute
      PHONE:       phone,        // custom attribute (create in Brevo if needed)
      ADDRESS:     address,
      LINKEDIN:    linkedin,
      FACEBOOK:    facebook,
      INSTAGRAM:   instagram,
      YOUTUBE:     youtube,
      WEBSITE:     website,
      SIGNUP_SRC:  'the-mixer.com',
    },
  };

  // 7. Call Brevo
  try {
    const brevoResp = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'api-key':       process.env.BREVO_API_KEY,
        'content-type':  'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Brevo returns 201 for new contact, 204 for updated contact
    if (brevoResp.ok || brevoResp.status === 204) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    }

    const errText = await brevoResp.text();
    console.error('Brevo error:', brevoResp.status, errText);

    // Friendly message for duplicate (Brevo returns 400 + code duplicate_parameter
    // if updateEnabled isn't honored for some reason)
    let userMsg = 'We couldn\'t complete your registration. Please try again.';
    try {
      const errJson = JSON.parse(errText);
      if (errJson.code === 'duplicate_parameter') {
        userMsg = 'You\'re already registered — see you at the Mixer!';
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, message: userMsg }),
        };
      }
    } catch { /* fall through */ }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: userMsg }),
    };
  } catch (err) {
    console.error('Signup function exception:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error. Please try again or contact us directly.' }),
    };
  }
};
