/* Cravo — comportamento do site */
(function () {
  "use strict";

  /* ---------- ano no rodapé ---------- */
  var ano = document.getElementById("ano");
  if (ano) ano.textContent = String(new Date().getFullYear());

  /* ---------- menu mobile ---------- */
  var botao = document.querySelector(".topo__menu");
  var nav = document.getElementById("menu");
  if (botao && nav) {
    botao.addEventListener("click", function () {
      var aberto = nav.classList.toggle("aberto");
      botao.setAttribute("aria-expanded", aberto ? "true" : "false");
    });
    nav.addEventListener("click", function (ev) {
      if (ev.target.tagName === "A") {
        nav.classList.remove("aberto");
        botao.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- revelacao ao rolar ---------- */
  var alvos = document.querySelectorAll(
    ".cartao, .diferenciais li, .passos li, .galeria__item, .formulario, .atelie__foto, .hero__foto"
  );
  if ("IntersectionObserver" in window && alvos.length) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visivel");
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    alvos.forEach(function (el, i) {
      el.classList.add("revela");
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      obs.observe(el);
    });
  }
  /* rede de seguranca: se a revelacao nao rodar, nada fica invisivel */
  window.setTimeout(function () {
    document.querySelectorAll(".revela:not(.visivel)").forEach(function (el) {
      el.classList.add("visivel");
    });
  }, 1600);

  /* ---------- formularios ---------- */
  var CHAVE = "cravo.pedidos";

  function lerPedidos() {
    try {
      return JSON.parse(window.localStorage.getItem(CHAVE) || "[]");
    } catch (e) {
      return [];
    }
  }

  function gravarPedido(pedido) {
    try {
      var lista = lerPedidos();
      lista.push(pedido);
      window.localStorage.setItem(CHAVE, JSON.stringify(lista));
    } catch (e) {
      /* armazenamento indisponivel: o pedido continua valido na sessao */
    }
  }

  function baixarCopia(pedido) {
    var linhas = [
      "PEDIDO ENVIADO PELO SITE CRAVO",
      "-------------------------------------",
      "Tipo: " + pedido.tipo,
      "Nome: " + pedido.nome,
      "E-mail: " + pedido.email
    ];
    if (pedido.pessoas) linhas.push("Pessoas: " + pedido.pessoas);
    if (pedido.sabado) linhas.push("Sábado de preferência: " + pedido.sabado);
    if (pedido.mensagem) linhas.push("Mensagem: " + pedido.mensagem);
    linhas.push("Data: " + pedido.data);
    linhas.push("");
    linhas.push("Guardado neste navegador pelo site da Cravo.");
    var blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = pedido.tipo === "aula" ? "pedido-aula-cravo.txt" : "pedido-fornada-cravo.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function validar(form) {
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (campo) {
      var wrapper = campo.closest(".campo");
      var erroAntigo = wrapper.querySelector(".campo__erro");
      if (erroAntigo) erroAntigo.remove();
      wrapper.classList.remove("campo--erro");
      var valor = (campo.value || "").trim();
      var mensagem = "";
      if (!valor) {
        mensagem = "Preencha este campo.";
      } else if (campo.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
        mensagem = "Confira o e-mail: escreva assim: nome@seudominio.com.br";
      }
      if (mensagem) {
        ok = false;
        wrapper.classList.add("campo--erro");
        var p = document.createElement("p");
        p.className = "campo__erro";
        p.textContent = mensagem;
        wrapper.appendChild(p);
        campo.setAttribute("aria-invalid", "true");
      } else {
        campo.removeAttribute("aria-invalid");
      }
    });
    return ok;
  }

  function montarPedido(form, tipo) {
    var dados = new FormData(form);
    return {
      tipo: tipo,
      nome: (dados.get("nome") || "").toString().trim(),
      email: (dados.get("email") || "").toString().trim(),
      pessoas: (dados.get("pessoas") || "").toString().trim(),
      sabado: (dados.get("sabado") || "").toString().trim(),
      mensagem: (dados.get("mensagem") || "").toString().trim(),
      data: new Date().toLocaleString("pt-BR")
    };
  }

  function tratar(form, tipo, mensagens) {
    var status = form.querySelector(".formulario__status");
    if (!validar(form)) {
      status.textContent = mensagens.erro;
      status.className = "formulario__status formulario__status--erro";
      return;
    }
    var pedido = montarPedido(form, tipo);
    gravarPedido(pedido);
    status.className = "formulario__status formulario__status--ok";
    status.innerHTML = "";
    var texto = document.createElement("span");
    texto.textContent = mensagens.ok;
    status.appendChild(texto);
    var link = document.createElement("a");
    link.className = "link-download";
    link.href = "#";
    link.textContent = " Baixar uma cópia do pedido";
    link.addEventListener("click", function (ev) {
      ev.preventDefault();
      baixarCopia(pedido);
    });
    status.appendChild(link);
    form.reset();
  }

  var formAula = document.getElementById("form-aula");
  if (formAula) {
    formAula.addEventListener("submit", function (ev) {
      ev.preventDefault();
      tratar(formAula, "aula", {
        ok: "Pedido de reserva registrado. ",
        erro: "Revise os campos destacados para enviar seu pedido."
      });
    });
  }

  var formFornada = document.getElementById("form-fornada");
  if (formFornada) {
    formFornada.addEventListener("submit", function (ev) {
      ev.preventDefault();
      tratar(formFornada, "fornada", {
        ok: "Cadastro na lista de fornada registrado. ",
        erro: "Revise o e-mail destacado para entrar na lista."
      });
    });
  }

  /* ---------- ano do rodapé e ajuste de hash ---------- */
  window.addEventListener("load", function () {
    if (window.location.hash) {
      var alvo = document.querySelector(window.location.hash);
      if (alvo) alvo.scrollIntoView({ block: "start" });
    }
  });
})();
