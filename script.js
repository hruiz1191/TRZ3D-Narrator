function waitForVoices() {
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length) {
      resolve(voices);
      return;
    }
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
      resolve(voices);
    };
  });
}


async function cargarEntrada() {
  const params = new URLSearchParams(window.location.search);
  const archivo = params.get("file") || `docs/${new Date().toISOString().slice(0, 10)}.txt`;

  try {
    const res = await fetch(archivo);
    const contenido = await res.text();

    const lineas = contenido.split('\n');
    const titulo = lineas[0].replace('Título: ', '').trim();
    const imagen = lineas[1].replace('Imagen: ', '').trim() || 'images/default.jpg';
    const texto = lineas.slice(3).join(' ').trim();

    document.getElementById('titulo').innerText = titulo;
    cargarTextoConSpan(texto);
    document.getElementById('bg-image').src = imagen;
  } catch (e) {
    document.getElementById('titulo').innerText = 'Contenido no disponible';
    document.getElementById('texto').innerHTML = '<span>No se encontró el archivo.</span>';
    document.body.style.backgroundImage = `url('${imagen}')`;
  }
}

function cargarTextoConSpan(texto) {
  const contenedor = document.getElementById('texto');
  contenedor.innerHTML = '';
  let index = 0;

  for (let i = 0; i < texto.length; i++) {
    const span = document.createElement('span');
    span.textContent = texto[i];
    span.dataset.start = index;
    contenedor.appendChild(span);
    index++;
  }

  console.log(`📦 Total spans creados: ${index}`);
  
}




let isPlaying = false;
let utterance;

async function toggleLectura() {
  if (isPlaying) {
    speechSynthesis.cancel();
    isPlaying = false;
    document.getElementById('playBtn').innerText = '▶️ Play';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const idioma = params.get('lang') || 'es-ES';
  const rate = parseFloat(params.get('rate')) || 1;
  const gender = params.get('gender') || 'female';
  const texto = Array.from(document.getElementById('texto').querySelectorAll('span')).map(s => s.textContent).join('');


  const voces = await waitForVoices(); // ✅ asegurarse que estén listas
  let vozSeleccionada = voces.find(v => v.lang === idioma && v.name.toLowerCase().includes(gender));
  if (!vozSeleccionada) vozSeleccionada = voces.find(v => v.lang === idioma) || voces[0];

  utterance = new SpeechSynthesisUtterance(texto);
  utterance.voice = vozSeleccionada;
  utterance.lang = idioma;
  utterance.rate = rate;

  const spans = document.getElementById('texto').querySelectorAll('span');

utterance.onboundary = function (event) {
  const charIndex = event.charIndex;
  console.log("📍 onboundary activado", event);
  console.log("🧠 charIndex:", charIndex);

  const spans = document.querySelectorAll('#texto span');

  let currentSpan = null;

  // Buscar el span correspondiente al índice actual
  for (let span of spans) {
    const start = parseInt(span.dataset.start);
    const end = start + span.textContent.length;
    if (charIndex >= start && charIndex < end) {
      currentSpan = span;
      break;
    }
  }

  // Limpiar highlights anteriores
  spans.forEach(s => s.classList.remove('highlight'));

  if (currentSpan) {
    currentSpan.classList.add('highlight');
    currentSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    console.log("✅ Highlight:", currentSpan.textContent, `(${currentSpan.dataset.start}–${parseInt(currentSpan.dataset.start) + currentSpan.textContent.length})`);
  } else {
    console.log("❌ No match for charIndex:", charIndex);
  }
};



  utterance.onend = function () {
    isPlaying = false;
    document.getElementById('playBtn').innerText = '▶️ Play';
  };

  speechSynthesis.speak(utterance);
  isPlaying = true;
  document.getElementById('playBtn').innerText = '⏸️ Pause';
}


// Compartir
function share(platform) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.getElementById('titulo').innerText);
  let shareURL = '';

  switch (platform) {
    case 'whatsapp':
      shareURL = `https://wa.me/?text=${title}%20${url}`;
      break;
    case 'facebook':
      shareURL = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case 'twitter':
      shareURL = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
      break;
    case 'messenger':
      shareURL = `fb-messenger://share/?link=${url}`;
      break;
    case 'reddit':
      shareURL = `https://www.reddit.com/submit?title=${title}&url=${url}`;
      break;
    case 'telegram':
      shareURL = `https://t.me/share/url?url=${url}&text=${title}`;
      break;
    case 'linkedin':
      shareURL = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      break;
    case 'email':
      shareURL = `mailto:?subject=${title}&body=${url}`;
      break;
    default:
      alert("Unknown platform");
      return;
  }

  window.open(shareURL, '_blank');
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    alert("🔗 Link copied!");
  });
}

window.onload = async () => {
  await waitForVoices();
  cargarEntrada();
};
