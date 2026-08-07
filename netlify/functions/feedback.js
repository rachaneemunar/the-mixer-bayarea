document.querySelector("#feedback-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  const payload = {
    name: form.name.value,
    email: form.email.value,
    enjoyed: form.enjoyed.value,
    improve: form.improve.value,
    topics: form.topics.value,
    recommend: form.recommend.value,
  };

  const res = await fetch("/.netlify/functions/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    // show your existing "Thank You" confirmation state
  } else {
    // show an error message
  }
});
