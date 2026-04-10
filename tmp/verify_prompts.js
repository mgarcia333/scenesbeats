
const labels = {
  es: { favs: "FAVORITOS DEL USUARIO:", movies: "Películas", songs: "Canciones", system: "Eres un curator cultural de élite...", rule: "Respuesta en JSON estricto... ESPAÑOL." },
  en: { favs: "USER FAVORITES:", movies: "Movies", songs: "Songs", system: "You are an elite cultural curator...", rule: "Strict JSON response... ENGLISH." },
  ca: { favs: "PREFERITS DE L'USUARI:", movies: "Pel·lícules", songs: "Cançons", system: "Ets un curador cultural d'elit...", rule: "Resposta en JSON estricte... CATALÀ." }
};

const tasks = {
  es: { hybrid: "Crea una 'Experiencia Completa'..." },
  en: { hybrid: "Create a 'Full Experience'..." },
  ca: { hybrid: "Crea una 'Experiència Completa'..." }
};

function testPrompt(lang, mode) {
    const l = labels[lang] || labels.es;
    const t = tasks[lang] || tasks.es;
    const baseSystem = `${l.system}\nREGLA DE ORO: ${l.rule}`;
    console.log(`--- LANG: ${lang} ---`);
    console.log(`System: ${baseSystem}`);
    console.log(`Task: ${t[mode]}`);
}

testPrompt('es', 'hybrid');
testPrompt('en', 'hybrid');
testPrompt('ca', 'hybrid');
