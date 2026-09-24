(function () {
  "use strict";

  const fire = document.getElementById("rest-fire");
  const overlay = document.getElementById("rest-overlay");
  const caption = document.getElementById("rest-caption");
  const sparkField = document.getElementById("spark-field");
  const captions = [
    "The fire burns low, and the wilds grow quiet. Rest now, hero.",
    "Your wounds heal as the stars turn. Sleep well.",
    "The burdens of the realm can wait until dawn.",
    "Close your eyes. The shadows cannot reach you here."
  ];
  let lastCaption = -1;
  let restLocked = false;

  if (!fire || !overlay || !caption || !sparkField) return;

  function nextCaption() {
    let index = Math.floor(Math.random() * captions.length);
    if (captions.length > 1 && index === lastCaption) index = (index + 1) % captions.length;
    lastCaption = index;
    return captions[index];
  }

  function rest() {
    if (restLocked) return;
    restLocked = true;
    caption.textContent = nextCaption();
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.remove("is-resting");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { overlay.classList.add("is-resting"); });
    });
    window.setTimeout(function () { overlay.classList.remove("is-resting"); }, 6000);
    window.setTimeout(function () {
      overlay.setAttribute("aria-hidden", "true");
      caption.textContent = "";
      restLocked = false;
    }, 8000);
  }

  function kindle(event) {
    const rect = fire.getBoundingClientRect();
    const originX = event.clientX || rect.left + rect.width / 2;
    const originY = event.clientY || rect.top + rect.height * 0.72;
    const count = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 8 : 26;

    for (let index = 0; index < count; index += 1) {
      const spark = document.createElement("i");
      const drift = Math.round((Math.random() - 0.5) * 190);
      const rise = -Math.round(70 + Math.random() * 190);
      spark.className = "fire-spark";
      spark.style.setProperty("--spark-x", originX + "px");
      spark.style.setProperty("--spark-y", originY + "px");
      spark.style.setProperty("--spark-size", (2 + Math.random() * 4).toFixed(1) + "px");
      spark.style.setProperty("--spark-drift", drift + "px");
      spark.style.setProperty("--spark-rise", rise + "px");
      spark.style.setProperty("--spark-turn", Math.round((Math.random() - 0.5) * 240) + "deg");
      spark.style.setProperty("--spark-duration", (700 + Math.random() * 900).toFixed(0) + "ms");
      sparkField.appendChild(spark);
      spark.addEventListener("animationend", function () { spark.remove(); }, { once: true });
    }
  }

  fire.addEventListener("click", kindle);
  fire.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    rest();
  });
})();
