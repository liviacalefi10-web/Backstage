document.addEventListener("DOMContentLoaded", () => {

  const money = value =>
    Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  /* =========================
     LOCAL STORAGE
  ========================= */

  const getCart = () =>
    JSON.parse(localStorage.getItem("backstage_cart") || "[]");

  const setCart = cart => {
    localStorage.setItem("backstage_cart", JSON.stringify(cart));
    updateCartCount();
  };

  const getWish = () =>
    JSON.parse(localStorage.getItem("backstage_wishlist") || "[]");

  const setWish = wishlist =>
    localStorage.setItem(
      "backstage_wishlist",
      JSON.stringify(wishlist)
    );

  /* =========================
     CARRINHO
  ========================= */

  function updateCartCount() {
    const quantity = getCart().reduce(
      (total, item) => total + Number(item.qty || 0),
      0
    );

    document
      .querySelectorAll("#cartCount")
      .forEach(element => {
        element.textContent = quantity;
      });
  }

  function addCart(id, size, qty = 1) {
    id = Number(id);

    const product = PRODUCTS.find(product => product.id === id);

    if (!product) {
      toast("Produto não encontrado.");
      return;
    }

    const validSize =
      product.sizes.includes(size)
        ? size
        : product.sizes[0];

    const cart = getCart();

    const existing = cart.find(
      item =>
        Number(item.id) === id &&
        item.size === validSize
    );

    if (existing) {
      existing.qty += Number(qty);
    } else {
      cart.push({
        id: id,
        size: validSize,
        qty: Number(qty)
      });
    }

    setCart(cart);

    toast("Produto adicionado ao carrinho! 🛍️");
  }

  function changeQty(index, delta) {
    const cart = getCart();

    if (!cart[index]) return;

    cart[index].qty = Math.max(
      1,
      Number(cart[index].qty) + delta
    );

    setCart(cart);
    renderCart();
  }

  /* =========================
     WISHLIST
  ========================= */

  function isWish(id) {
    return getWish().includes(Number(id));
  }

  function toggleWish(id) {
    id = Number(id);

    let wishlist = getWish();

    if (wishlist.includes(id)) {
      wishlist = wishlist.filter(item => item !== id);
      toast("Produto removido dos favoritos.");
    } else {
      wishlist.push(id);
      toast("Produto salvo nos favoritos! ❤️");
    }

    setWish(wishlist);

    renderHome();
    renderProducts();
    renderProductDetail();
    renderWishlist();
  }

  /* =========================
     TOAST
  ========================= */

  function toast(message) {
    const oldToast = document.querySelector(".toast");

    if (oldToast) {
      oldToast.remove();
    }

    const element = document.createElement("div");

    element.className = "toast show";
    element.textContent = message;

    document.body.appendChild(element);

    setTimeout(() => {
      element.classList.remove("show");

      setTimeout(() => {
        element.remove();
      }, 250);

    }, 2200);
  }

  /* =========================
     CARD DO PRODUTO
  ========================= */

  function card(product) {

    const wished = isWish(product.id);

    return `
      <article class="product-card">

        <div class="product-image">

          <a href="produto.html?id=${product.id}">
            <img
              src="${product.image}"
              alt="${product.name}"
              loading="lazy"
              onerror="this.style.display='none'"
            >
          </a>

          <button
            type="button"
            class="wish-btn ${wished ? "selected" : ""}"
            data-wish="${product.id}"
            aria-label="${
              wished
                ? "Remover da lista de desejos"
                : "Adicionar à lista de desejos"
            }"
          >
            ${wished ? "♥" : "♡"}
          </button>

          ${
            product.bestseller
              ? `<span class="badge">MAIS VENDIDO</span>`
              : ""
          }

          ${
            product.promo
              ? `<span class="badge" style="top:43px;background:#8d55ad;">
                   OFERTA
                 </span>`
              : ""
          }

        </div>

        <div class="product-info">

          <a
            href="produto.html?id=${product.id}"
            class="product-name"
          >
            ${product.name}
          </a>

          <span class="product-category">
            ${product.category}
          </span>

          <strong>
            ${money(product.price)}
          </strong>

          <button
            type="button"
            class="quick-add"
            data-add="${product.id}"
          >
            Adicionar ao carrinho
          </button>

        </div>

      </article>
    `;
  }

  /* =========================
     EVENTOS DOS CARDS
  ========================= */

  function bindCards() {

    document
      .querySelectorAll("[data-wish]")
      .forEach(button => {

        button.onclick = event => {

          event.preventDefault();
          event.stopPropagation();

          toggleWish(button.dataset.wish);
        };

      });

    document
      .querySelectorAll("[data-add]")
      .forEach(button => {

        button.onclick = event => {

          event.preventDefault();
          event.stopPropagation();

          addCart(button.dataset.add);
        };

      });
  }

  /* =========================
     HOME
  ========================= */

  function renderHome() {

    const featured =
      document.getElementById("featuredProducts");

    if (featured) {

      const products = PRODUCTS
        .filter(product => product.bestseller)
        .slice(0, 6);

      featured.innerHTML =
        products.map(card).join("");

      bindCards();
    }

    const search = () => {

      const input =
        document.getElementById("homeSearch");

      const query =
        input?.value.trim() || "";

      if (query) {

        location.href =
          "produtos.html?busca=" +
          encodeURIComponent(query);

      } else {

        location.href =
          "produtos.html";
      }
    };

    document
      .getElementById("homeSearchBtn")
      ?.addEventListener("click", search);

    document
      .getElementById("homeSearch")
      ?.addEventListener("keydown", event => {

        if (event.key === "Enter") {
          search();
        }

      });
  }

  /* =========================
     PRODUTOS / FILTROS
  ========================= */

  function renderProducts() {

    const grid =
      document.getElementById("productGrid");

    if (!grid) return;

    const params =
      new URLSearchParams(location.search);

    const initialCategory =
      params.get("categoria") || "Todos";

    const initialSearch =
      params.get("busca") || "";

    const initialPromotion =
      params.get("promocao") === "true";

    const productSearch =
      document.getElementById("productSearch");

    if (productSearch) {
      productSearch.value = initialSearch;
    }

    document
      .querySelectorAll('input[name="category"]')
      .forEach(radio => {

        radio.checked =
          radio.value === initialCategory;

      });

    if (
      initialCategory !== "Todos" &&
      !document.querySelector(
        `input[name="category"][value="${CSS.escape(initialCategory)}"]`
      )
    ) {

      const all =
        document.querySelector(
          'input[name="category"][value="Todos"]'
        );

      if (all) {
        all.checked = true;
      }
    }

    function applyFilters() {

      let products = [...PRODUCTS];

      /* BUSCA */

      const query =
        (
          document.getElementById("productSearch")
            ?.value || ""
        )
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();

      /* CATEGORIA */

      const category =
        document.querySelector(
          'input[name="category"]:checked'
        )?.value || "Todos";

      /* TAMANHO */

      const sizes =
        [
          ...document.querySelectorAll(
            'input[name="size"]:checked'
          )
        ].map(input => input.value);

      /* COR */

      const colors =
        [
          ...document.querySelectorAll(
            'input[name="color"]:checked'
          )
        ].map(input => input.value);

      /* PREÇO */

      const minInput =
        parseFloat(
          document.getElementById("minPrice")?.value
        );

      const maxInput =
        parseFloat(
          document.getElementById("maxPrice")?.value
        );

      const min =
        Number.isFinite(minInput)
          ? minInput
          : 0;

      const max =
        Number.isFinite(maxInput)
          ? maxInput
          : Infinity;

      /* OCASIÃO */

      const occasion =
        document.getElementById("occasion")
          ?.value || "Todas";

      /* PROMOÇÃO */

      const promotion =
        initialPromotion;

      products = products.filter(product => {

        const searchable =
          `
          ${product.name}
          ${product.category}
          ${product.color}
          ${product.occasion}
          ${product.tags}
          `
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const matchesSearch =
          !query ||
          searchable.includes(query);

        const matchesCategory =
          category === "Todos" ||
          product.category === category;

        const matchesSize =
          sizes.length === 0 ||
          sizes.some(size =>
            product.sizes.includes(size)
          );

        const matchesColor =
          colors.length === 0 ||
          colors.includes(product.color);

        const matchesPrice =
          product.price >= min &&
          product.price <= max;

        const matchesOccasion =
          occasion === "Todas" ||
          product.occasion === occasion;

        const matchesPromotion =
          !promotion ||
          product.promo === true;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesSize &&
          matchesColor &&
          matchesPrice &&
          matchesOccasion &&
          matchesPromotion
        );
      });

      /* ORDENAÇÃO */

      const sort =
        document.getElementById("sortProducts")
          ?.value || "default";

      if (sort === "priceAsc") {

        products.sort(
          (a, b) => a.price - b.price
        );

      }

      if (sort === "priceDesc") {

        products.sort(
          (a, b) => b.price - a.price
        );

      }

      if (sort === "name") {

        products.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "pt-BR"
            )
        );

      }

      /* RENDER */

      grid.innerHTML =
        products.map(card).join("");

      /* CONTADOR */

      const count =
        document.getElementById("resultCount");

      if (count) {

        count.textContent =
          `${products.length} ${
            products.length === 1
              ? "produto encontrado"
              : "produtos encontrados"
          }`;

      }

      /* VAZIO */

      const empty =
        document.getElementById("emptyState");

      if (empty) {
        empty.hidden =
          products.length > 0;
      }

      bindCards();
    }

    /* EVENTOS DOS FILTROS */

    document
      .querySelectorAll(
        ".filters input, .filters select"
      )
      .forEach(element => {

        element.addEventListener(
          "change",
          applyFilters
        );

      });

    ["minPrice", "maxPrice"]
      .forEach(id => {

        document
          .getElementById(id)
          ?.addEventListener(
            "input",
            applyFilters
          );

      });

    document
      .getElementById("productSearch")
      ?.addEventListener(
        "input",
        applyFilters
      );

    document
      .getElementById("productSearchBtn")
      ?.addEventListener(
        "click",
        applyFilters
      );

    document
      .getElementById("sortProducts")
      ?.addEventListener(
        "change",
        applyFilters
      );

    /* LIMPAR FILTROS */

    document
      .getElementById("clearFilters")
      ?.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              'input[name="category"]'
            )
            .forEach(radio => {

              radio.checked =
                radio.value === "Todos";

            });

          document
            .querySelectorAll(
              '.filters input[type="checkbox"]'
            )
            .forEach(input => {

              input.checked = false;

            });

          const min =
            document.getElementById("minPrice");

          const max =
            document.getElementById("maxPrice");

          const occasion =
            document.getElementById("occasion");

          const search =
            document.getElementById("productSearch");

          if (min) min.value = "";
          if (max) max.value = "";
          if (occasion) occasion.value = "Todas";
          if (search) search.value = "";

          history.replaceState(
            null,
            "",
            "produtos.html"
          );

          applyFilters();
        }
      );

    /* FILTRO MOBILE */

    document
      .getElementById("openFilters")
      ?.addEventListener(
        "click",
        () => {

          document
            .querySelector(".filters")
            ?.classList.add("open");

        }
      );

    document
      .getElementById("closeFilters")
      ?.addEventListener(
        "click",
        () => {

          document
            .querySelector(".filters")
            ?.classList.remove("open");

        }
      );

    applyFilters();
  }

  /* =========================
     PRODUTO INDIVIDUAL
  ========================= */


  function renderMeasurements(product) {

    const measurementsElement =
      document.getElementById("measurements");

    if (!measurementsElement || !product.measurements) return;

    const { headers, rows } = product.measurements;

    measurementsElement.innerHTML = `
      <h2>
        Tabela de medidas
      </h2>

      <p class="muted">
        Medidas aproximadas da peça. Podem variar conforme a modelagem.
      </p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join("")}
            </tr>
          </thead>

          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(value => `<td>${value}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  const COMPLETE_LOOKS = {
    1: [16, 24, 17],
    2: [18, 24, 3],
    3: [6, 2, 9],
    4: [7, 24, 17],
    5: [21, 24, 17],
    6: [18, 24, 9],
    7: [5, 24, 17],
    8: [7, 5, 24],
    9: [6, 18, 3],
    10: [2, 18, 9],
    11: [7, 4, 24],
    12: [7, 4, 24],
    13: [19, 24, 17],
    14: [7, 5, 24],
    15: [7, 5, 24],
    16: [1, 24, 17],
    17: [7, 5, 14],
    18: [21, 24, 17],
    19: [13, 14, 24],
    20: [6, 5, 24],
    21: [18, 24, 17],
    22: [24, 17, 15],
    23: [6, 9, 18],
    24: [7, 5, 17],
    25: [7, 24, 17]
  };

  function renderCompleteLook(product) {

    const collage =
      document.querySelector(".look-collage");

    if (!collage) return;

    const ids =
      COMPLETE_LOOKS[product.id] || [];

    const items =
      ids
        .map(id => PRODUCTS.find(item => item.id === id))
        .filter(Boolean);

    collage.innerHTML = items.map(item => `
      <a
        href="produto.html?id=${item.id}"
        class="look-item"
        style="
          display:block;
          text-decoration:none;
          color:inherit;
          background:#fff;
          overflow:hidden;
        "
      >
        <img
          src="${item.image}"
          alt="${item.name}"
          loading="lazy"
          style="
            display:block;
            width:100%;
            height:180px;
            object-fit:cover;
          "
        >
        <span
          style="
            display:block;
            padding:10px;
            font-size:12px;
            font-weight:600;
          "
        >
          ${item.name}
        </span>
      </a>
    `).join("");

    collage.style.display = "grid";
    collage.style.gridTemplateColumns =
      "repeat(3, 1fr)";
    collage.style.gap = "10px";
    collage.style.padding = "10px";
    collage.style.background = "transparent";
  }

  function renderProductDetail() {

    const element =
      document.getElementById("productDetail");

    if (!element) return;

    const params =
      new URLSearchParams(location.search);

    const id =
      Number(params.get("id")) || 1;

    const product =
      PRODUCTS.find(
        item => item.id === id
      ) || PRODUCTS[0];

    document.title =
      `${product.name} | Backstage`;

    const breadcrumb =
      document.getElementById(
        "breadcrumbName"
      );

    if (breadcrumb) {
      breadcrumb.textContent =
        product.name;
    }

    const defaultSize =
      product.sizes.includes("M")
        ? "M"
        : product.sizes[0];

    const wished =
      isWish(product.id);

    element.innerHTML = `

      <div class="product-gallery">

        <div class="thumbs" aria-label="Fotos do produto">
          ${(product.images && product.images.length ? product.images : [product.image]).slice(0, 4).map((image, index) => `
            <button
              type="button"
              class="thumb${index === 0 ? " active" : ""}"
              data-gallery-index="${index}"
              aria-label="${product.name} - foto ${index + 1}"
              aria-pressed="${index === 0 ? "true" : "false"}"
            >
              <img
                src="${image}"
                alt="${product.name} - foto ${index + 1}"
              >
            </button>
          `).join("")}
        </div>

        <div class="main-product-image">
          <img
            id="mainProductImg"
            src="${(product.images && product.images.length ? product.images : [product.image])[0]}"
            alt="${product.name} - foto 1"
          >

          <span class="zoom-hint">
            ⌕ Passe o mouse para ampliar
          </span>
        </div>

      </div>

      <div class="product-summary">

        <div class="summary-top">

          <span class="product-category">
            ${product.category}
          </span>

          <button
            type="button"
            class="wish-large ${
              wished ? "selected" : ""
            }"
            data-wish-detail="${product.id}"
            aria-label="${
              wished
                ? "Remover dos favoritos"
                : "Adicionar aos favoritos"
            }"
          >
            ${wished ? "♥" : "♡"}
          </button>

        </div>

        <h1>
          ${product.name}
        </h1>

        <div class="rating">
          ★★★★★
          <span>
            4.9 (28 avaliações)
          </span>
        </div>

        <div class="detail-price">
          ${money(product.price)}
        </div>

        <p class="installment">
          ou 3x de
          ${money(product.price / 3)}
          sem juros
        </p>

        <p>
          ${product.desc}
        </p>

        <div class="option-block">

          <label>
            Tamanho
          </label>

          <div class="size-picker">

            ${product.sizes
              .map(
                size => `
                  <button
                    type="button"
                    class="size-option ${
                      size === defaultSize
                        ? "selected"
                        : ""
                    }"
                    data-size="${size}"
                  >
                    ${size}
                  </button>
                `
              )
              .join("")}

          </div>

          <a
            href="#measurements"
            class="measure-link"
          >
            Ver tabela de medidas
          </a>

        </div>

        <div class="buy-actions">

          <button
            type="button"
            class="btn btn-dark"
            id="buyNow"
          >
            COMPRAR AGORA
          </button>

          <button
            type="button"
            class="btn btn-outline"
            id="addDetailCart"
          >
            ADICIONAR AO CARRINHO 🛒
          </button>

        </div>

        <div class="shipping-box">

          <b>
            🚚 Frete calculado no checkout
          </b>

          <span>
            Envio para todo o Brasil
          </span>

        </div>

      </div>
    `;

    /* DESCRIÇÃO */

    document
      .getElementById("productDescription")
      ?.replaceChildren(
        document.createTextNode(
          product.desc
        )
      );

    /* COMPOSIÇÃO */

    document
      .getElementById("productComposition")
      ?.replaceChildren(
        document.createTextNode(
          product.composition
        )
      );

    renderMeasurements(product);

    renderCompleteLook(product);

    /* GALERIA */

    const productImages =
      product.images && product.images.length
        ? product.images.slice(0, 4)
        : [product.image];

    document
      .querySelectorAll(".thumb")
      .forEach(thumb => {

        thumb.addEventListener("click", () => {
          const index = Number(thumb.dataset.galleryIndex);
          const image = productImages[index] || productImages[0];
          const main = document.getElementById("mainProductImg");

          document
            .querySelectorAll(".thumb")
            .forEach(item => {
              item.classList.remove("active");
              item.setAttribute("aria-pressed", "false");
            });

          thumb.classList.add("active");
          thumb.setAttribute("aria-pressed", "true");

          if (main && image) {
            main.src = image;
            main.alt = `${product.name} - foto ${index + 1}`;
          }
        });
      });


    /* TAMANHOS */

    document
      .querySelectorAll(".size-option")
      .forEach(button => {

        button.onclick = () => {

          document
            .querySelectorAll(
              ".size-option"
            )
            .forEach(item =>
              item.classList.remove(
                "selected"
              )
            );

          button.classList.add(
            "selected"
          );
        };
      });

    /* ADICIONAR AO CARRINHO */

    document
      .getElementById("addDetailCart")
      ?.addEventListener(
        "click",
        () => {

          const selected =
            document.querySelector(
              ".size-option.selected"
            );

          addCart(
            product.id,
            selected?.dataset.size
          );
        }
      );

    /* COMPRAR AGORA */

    document
      .getElementById("buyNow")
      ?.addEventListener(
        "click",
        () => {

          const selected =
            document.querySelector(
              ".size-option.selected"
            );

          addCart(
            product.id,
            selected?.dataset.size
          );

          setTimeout(() => {
            location.href =
              "checkout.html";
          }, 150);

        }
      );

    /* WISHLIST */

    document
      .querySelector(
        "[data-wish-detail]"
      )
      ?.addEventListener(
        "click",
        () => toggleWish(product.id)
      );

    /* ABAS */

    document
      .querySelectorAll(".tab")
      .forEach(tab => {

        tab.onclick = () => {

          document
            .querySelectorAll(".tab")
            .forEach(item =>
              item.classList.remove(
                "active"
              )
            );

          document
            .querySelectorAll(
              ".tab-content"
            )
            .forEach(content =>
              content.hidden = true
            );

          tab.classList.add(
            "active"
          );

          const content =
            document.getElementById(
              tab.dataset.tab
            );

          if (content) {
            content.hidden = false;
          }

        };

      });

    /* PRODUTOS RELACIONADOS */

    const related =
      PRODUCTS
        .filter(item => item.id !== product.id)
        .map(item => {

          let score = 0;

          if (item.category === product.category) {
            score += 4;
          }

          if (item.occasion === product.occasion) {
            score += 3;
          }

          if (item.color === product.color) {
            score += 2;
          }

          const productTags =
            (product.tags || "")
              .toLowerCase()
              .split(/\s+/)
              .filter(Boolean);

          const itemTags =
            (item.tags || "")
              .toLowerCase()
              .split(/\s+/)
              .filter(Boolean);

          const commonTags =
            itemTags.filter(tag =>
              productTags.includes(tag)
            ).length;

          score += Math.min(commonTags, 2);

          return { item, score };

        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(entry => entry.item);

    const relatedElement =
      document.getElementById(
        "relatedProducts"
      );

    if (relatedElement) {

      relatedElement.innerHTML =
        related.map(card).join("");

      bindCards();
    }
  }

  /* =========================
     CARRINHO
  ========================= */

  function renderCart() {

    const element =
      document.getElementById(
        "cartContent"
      );

    if (!element) return;

    let cart = getCart();

    /* REMOVE PRODUTOS QUE NÃO EXISTEM */

    cart = cart.filter(item =>
      PRODUCTS.some(
        product =>
          product.id === Number(item.id)
      )
    );

    if (!cart.length) {

      setCart([]);

      element.innerHTML = `
        <div class="empty-state">

          <span>🛒</span>

          <h2>
            Seu carrinho está vazio
          </h2>

          <p>
            Encontre uma peça que combine com você.
          </p>

          <a
            class="btn btn-dark"
            href="produtos.html"
          >
            Continuar comprando
          </a>

        </div>
      `;

      return;
    }

    setCart(cart);

    const items =
      cart
        .map((item, index) => {

          const product =
            PRODUCTS.find(
              product =>
                product.id ===
                Number(item.id)
            );

          if (!product) return "";

          return `
            <div class="cart-item">

              <a
                href="produto.html?id=${product.id}"
              >
                <img
                  src="${product.image}"
                  alt="${product.name}"
                >
              </a>

              <div class="cart-item-info">

                <a
                  href="produto.html?id=${product.id}"
                >
                  <h3>
                    ${product.name}
                  </h3>
                </a>

                <p>
                  Tamanho:
                  ${item.size}
                </p>

                <strong>
                  ${money(product.price)}
                </strong>

              </div>

              <div class="qty">

                <button
                  type="button"
                  data-minus="${index}"
                >
                  −
                </button>

                <span>
                  ${item.qty}
                </span>

                <button
                  type="button"
                  data-plus="${index}"
                >
                  +
                </button>

              </div>

              <button
                type="button"
                class="remove"
                data-remove="${index}"
                aria-label="Remover produto"
              >
                ×
              </button>

            </div>
          `;
        })
        .join("");

    const subtotal =
      cart.reduce(
        (total, item) => {

          const product =
            PRODUCTS.find(
              product =>
                product.id ===
                Number(item.id)
            );

          return (
            total +
            (
              product
                ? product.price
                : 0
            ) *
              Number(item.qty)
          );
        },
        0
      );

    const shipping =
      subtotal >= 199
        ? 0
        : 15.90;

    element.innerHTML = `

      <div class="cart-layout">

        <section class="cart-items">

          <div class="cart-head">
            <span>Produto</span>
            <span>Quantidade</span>
            <span>Remover</span>
          </div>

          ${items}

          <a
            href="produtos.html"
            class="continue"
          >
            ← Continuar comprando
          </a>

        </section>

        <aside class="summary-card">

          <h2>
            Resumo
          </h2>

          <p>
            Subtotal
            <b>
              ${money(subtotal)}
            </b>
          </p>

          <p>
            Frete
            <b>
              ${
                shipping
                  ? money(shipping)
                  : "Grátis"
              }
            </b>
          </p>

          <hr>

          <p class="total">
            Total
            <b>
              ${money(
                subtotal + shipping
              )}
            </b>
          </p>

          <a
            class="btn btn-dark full"
            href="checkout.html"
          >
            IR PARA CHECKOUT
          </a>

          <small>
            🔒 Compra segura e protegida
          </small>

        </aside>

      </div>
    `;

    document
      .querySelectorAll("[data-minus]")
      .forEach(button => {

        button.onclick = () =>
          changeQty(
            Number(
              button.dataset.minus
            ),
            -1
          );

      });

    document
      .querySelectorAll("[data-plus]")
      .forEach(button => {

        button.onclick = () =>
          changeQty(
            Number(
              button.dataset.plus
            ),
            1
          );

      });

    document
      .querySelectorAll("[data-remove]")
      .forEach(button => {

        button.onclick = () => {

          const updated =
            getCart();

          updated.splice(
            Number(
              button.dataset.remove
            ),
            1
          );

          setCart(updated);
          renderCart();
        };

      });
  }

  /* =========================
     WISHLIST
  ========================= */

  function renderWishlist() {

    const grid =
      document.getElementById(
        "wishlistGrid"
      );

    if (!grid) return;

    const wishlist =
      getWish();

    const products =
      PRODUCTS.filter(product =>
        wishlist.includes(product.id)
      );

    grid.innerHTML =
      products.map(card).join("");

    const empty =
      document.getElementById(
        "wishlistEmpty"
      );

    if (empty) {

      empty.style.display =
        products.length
          ? "none"
          : "flex";
    }

    bindCards();
  }

  /* =========================
     CHECKOUT
  ========================= */

function renderCheckout() {

  /* =========================
     PROTEÇÃO DO CHECKOUT
  ========================= */

  if (
    location.pathname.endsWith("checkout.html") &&
    !isLogged()
  ) {

    alert(
      "Faça login ou cadastre-se antes de finalizar a compra."
    );

    location.href =
      "login.html";

    return;
  }


  /* =========================
     ELEMENTOS
  ========================= */

  const items =
    document.getElementById(
      "checkoutItems"
    );

  if (!items) return;


  /* =========================
     CARRINHO
  ========================= */

  const cart =
    getCart().filter(item =>
      PRODUCTS.some(
        product =>
          product.id ===
          Number(item.id)
      )
    );


  if (!cart.length) {

    items.innerHTML = `
      <div
        style="
          padding:20px 0;
          text-align:center;
        "
      >

        <p>
          Seu carrinho está vazio.
        </p>

        <a
          href="produtos.html"
          class="btn btn-dark"
          style="
            display:inline-block;
            margin-top:12px;
          "
        >
          Continuar comprando
        </a>

      </div>
    `;

    return;
  }


  /* =========================
     REVISÃO DOS PRODUTOS
  ========================= */

  items.innerHTML =
    cart
      .map(item => {

        const product =
          PRODUCTS.find(
            product =>
              product.id ===
              Number(item.id)
          );

        if (!product) {
          return "";
        }

        return `
          <div class="mini-item">

            <img
              src="${product.image}"
              alt="${product.name}"
            >

            <div>

              <b>
                ${product.name}
              </b>

              <span>
                Tamanho: ${item.size}
                · Quantidade: ${item.qty}
              </span>

            </div>

            <strong>
              ${money(
                product.price *
                Number(item.qty)
              )}
            </strong>

          </div>
        `;

      })
      .join("");


  /* =========================
     VALORES
  ========================= */

  const subtotal =
    cart.reduce(
      (total, item) => {

        const product =
          PRODUCTS.find(
            product =>
              product.id ===
              Number(item.id)
          );

        if (!product) {
          return total;
        }

        return (
          total +
          product.price *
          Number(item.qty)
        );

      },
      0
    );


  const shipping =
    subtotal >= 199
      ? 0
      : 15.90;


  const total =
    subtotal + shipping;


  /* =========================
     MOSTRAR VALORES
  ========================= */

  const subtotalElement =
    document.getElementById(
      "checkoutSubtotal"
    );

  const shippingElement =
    document.getElementById(
      "checkoutShipping"
    );

  const totalElement =
    document.getElementById(
      "checkoutTotal"
    );


  if (subtotalElement) {

    subtotalElement.textContent =
      money(subtotal);

  }


  if (shippingElement) {

    shippingElement.textContent =
      shipping
        ? money(shipping)
        : "Grátis";

  }


  if (totalElement) {

    totalElement.textContent =
      money(total);

  }


  /* =========================
     PAGAMENTOS
  ========================= */

  const paymentRadios =
    document.querySelectorAll(
      'input[name="payment"]'
    );


  const cardFields =
    document.getElementById(
      "cardFields"
    );

  const pixFields =
    document.getElementById(
      "pixFields"
    );

  const boletoFields =
    document.getElementById(
      "boletoFields"
    );


  const cardNumber =
    document.getElementById(
      "cardNumber"
    );

  const cardExpiry =
    document.getElementById(
      "cardExpiry"
    );

  const cardCvv =
    document.getElementById(
      "cardCvv"
    );


  function updatePaymentFields() {

    const selected =
      document.querySelector(
        'input[name="payment"]:checked'
      )?.value;


    /* CARTÃO */

    if (cardFields) {

      cardFields.style.display =
        selected === "cartao"
          ? "grid"
          : "none";

    }


    /* PIX */

    if (pixFields) {

      pixFields.style.display =
        selected === "pix"
          ? "block"
          : "none";

    }


    /* BOLETO */

    if (boletoFields) {

      boletoFields.style.display =
        selected === "boleto"
          ? "block"
          : "none";

    }


    /* CAMPOS OBRIGATÓRIOS DO CARTÃO */

    if (cardNumber) {

      cardNumber.required =
        selected === "cartao";

    }

    if (cardExpiry) {

      cardExpiry.required =
        selected === "cartao";

    }

    if (cardCvv) {

      cardCvv.required =
        selected === "cartao";

    }

  }


  paymentRadios.forEach(radio => {

    radio.onchange =
      updatePaymentFields;

  });


  updatePaymentFields();


  /* =========================
     QR CODE PIX
  ========================= */

  const pixQrCode =
    document.getElementById(
      "pixQrCode"
    );


  if (pixQrCode) {

    /*
      QR Code demonstrativo.
      Ele representa um texto de demonstração
      para o projeto da Backstage.
    */

    const qrMatrix = [

      "11111110001001101011001111111",
      "10000010011101111010101000001",
      "10111010011111010110101011101",
      "10111010010011100000001011101",
      "10111010010101110110001011101",
      "10000010100011101010101000001",
      "11111110101010101010101111111",
      "00000000000000101000100000000",
      "10010110111010000001010100000",
      "00100000110110111100001010000",
      "01101111110010010000000110101",
      "10110101010000111011101100011",
      "10101010111100011011000001101",
      "01000100001000010101001001110",
      "10110110001010001111110011110",
      "10110001101101101000110011101",
      "01100010011001110110111000001",
      "01001101111100000001011110101",
      "10010110011001001111100010111",
      "00101000011111001111111110000",
      "10010111110000101001111110111",
      "00000000100111000010100010010",
      "11111110001101110111101010010",
      "10000010101011010100100011011",
      "10111010001000100001111110000",
      "10111010111011111010111011001",
      "10111010001011010010100110101",
      "10000010011001111100011011111",
      "11111110101011011101110111100"

    ];


    pixQrCode.innerHTML = "";


    const qr =
      document.createElement(
        "div"
      );


    qr.style.display =
      "grid";

    qr.style.gridTemplateColumns =
      `repeat(${qrMatrix[0].length}, 6px)`;

    qr.style.gridTemplateRows =
      `repeat(${qrMatrix.length}, 6px)`;

    qr.style.width =
      "174px";

    qr.style.height =
      "174px";

    qr.style.background =
      "#fff";

    qr.style.padding =
      "8px";

    qr.style.boxSizing =
      "content-box";


    qrMatrix.forEach(row => {

      row
        .split("")
        .forEach(value => {

          const cell =
            document.createElement(
              "span"
            );

          cell.style.width =
            "6px";

          cell.style.height =
            "6px";

          cell.style.background =
            value === "1"
              ? "#111"
              : "#fff";

          qr.appendChild(cell);

        });

    });


    pixQrCode.appendChild(qr);

  }


  /* =========================
     COPIAR PIX
  ========================= */

  const copyPix =
    document.getElementById(
      "copyPix"
    );

  const pixCode =
    document.getElementById(
      "pixCode"
    );


  if (
    copyPix &&
    pixCode &&
    !copyPix.dataset.initialized
  ) {

    copyPix.dataset.initialized =
      "true";


    copyPix.addEventListener(
      "click",
      async () => {

        try {

          await navigator.clipboard.writeText(
            pixCode.value
          );

          toast(
            "Código Pix copiado! 💜"
          );

        } catch {

          pixCode.select();

          document.execCommand(
            "copy"
          );

          toast(
            "Código Pix copiado! 💜"
          );

        }

      }
    );

  }


  /* =========================
     FINALIZAÇÃO DO PEDIDO
  ========================= */

  const checkoutForm =
    document.getElementById(
      "checkoutForm"
    );


  if (
    checkoutForm &&
    !checkoutForm.dataset.initialized
  ) {

    checkoutForm.dataset.initialized =
      "true";


    checkoutForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        /* VERIFICA LOGIN */

        if (!isLogged()) {

          alert(
            "Faça login ou cadastre-se antes de finalizar a compra."
          );

          location.href =
            "login.html";

          return;
        }


        /* VERIFICA CARRINHO */

        const currentCart =
          getCart();

        if (!currentCart.length) {

          toast(
            "Adicione produtos ao carrinho antes de finalizar."
          );

          return;
        }


        /* VERIFICA ENDEREÇO */

        const cep =
          document
            .getElementById(
              "checkoutCep"
            )
            ?.value.trim();

        const state =
          document
            .getElementById(
              "checkoutState"
            )
            ?.value;

        const address =
          document
            .getElementById(
              "checkoutAddress"
            )
            ?.value.trim();

        const number =
          document
            .getElementById(
              "checkoutNumber"
            )
            ?.value.trim();

        const neighborhood =
          document
            .getElementById(
              "checkoutNeighborhood"
            )
            ?.value.trim();

        const city =
          document
            .getElementById(
              "checkoutCity"
            )
            ?.value.trim();

        const complement =
          document
            .getElementById(
              "checkoutComplement"
            )
            ?.value.trim();


        if (
          !cep ||
          !state ||
          !address ||
          !number ||
          !neighborhood ||
          !city
        ) {

          alert(
            "Preencha todos os dados do endereço de entrega."
          );

          return;
        }


        /* VERIFICA PAGAMENTO */

        const payment =
          document.querySelector(
            'input[name="payment"]:checked'
          )?.value;


        if (!payment) {

          alert(
            "Selecione uma forma de pagamento."
          );

          return;
        }


        /* VALIDA CARTÃO */

        if (payment === "cartao") {

          const number =
            cardNumber?.value
              .replace(/\s/g, "");

          const expiry =
            cardExpiry?.value.trim();

          const cvv =
            cardCvv?.value.trim();


          if (
            !number ||
            number.length < 13 ||
            !expiry ||
            !cvv
          ) {

            alert(
              "Preencha corretamente os dados do cartão."
            );

            return;
          }

        }


        /* =========================
           CRIA PEDIDO
        ========================= */

        const orders =
          JSON.parse(
            localStorage.getItem(
              "backstage_orders"
            ) || "[]"
          );


        const orderNumber =
          "BS" +
          Date.now()
            .toString()
            .slice(-8);


        const paymentNames = {

          cartao:
            "Cartão de crédito",

          pix:
            "Pix",

          boleto:
            "Boleto bancário"

        };


        const order = {

          id:
            orderNumber,

          date:
            new Date().toISOString(),

          customer:
            getAccount(),

          products:
            currentCart.map(item => {

              const product =
                PRODUCTS.find(
                  product =>
                    product.id ===
                    Number(item.id)
                );

              return {

                id:
                  product.id,

                name:
                  product.name,

                size:
                  item.size,

                quantity:
                  Number(item.qty),

                price:
                  product.price

              };

            }),

          address: {

            cep,

            state,

            address,

            number,

            neighborhood,

            city,

            complement

          },

          payment:
            paymentNames[payment],

          subtotal,

          shipping,

          total,

          status:
            payment === "cartao"
              ? "Pagamento aprovado"
              : "Aguardando pagamento"

        };


        orders.push(order);


        localStorage.setItem(
          "backstage_orders",
          JSON.stringify(orders)
        );


        /* LIMPA CARRINHO */

        localStorage.removeItem(
          "backstage_cart"
        );


        updateCartCount();


        /* =========================
           MENSAGEM FINAL
        ========================= */

        if (payment === "pix") {

          alert(
            `Pedido ${orderNumber} realizado com sucesso! 💜\n\nForma de pagamento: Pix\nStatus: Aguardando pagamento.\n\nO QR Code está disponível nesta página.`
          );

        } else if (
          payment === "boleto"
        ) {

          alert(
            `Pedido ${orderNumber} realizado com sucesso! 💜\n\nForma de pagamento: Boleto bancário\nStatus: Aguardando pagamento.`
          );

        } else {

          alert(
            `Pedido ${orderNumber} realizado com sucesso! 💜\n\nPagamento aprovado no cartão.`
          );

        }


        location.href =
          "index.html";

      }
    );

  }

}

  /* =========================
     LOGIN / CADASTRO
  ========================= */

  function getAccount() {
    try {
      return JSON.parse(
        localStorage.getItem("backstage_account") || "null"
      );
    } catch {
      return null;
    }
  }

  function isLogged() {
    return localStorage.getItem("backstage_logged") === "1" && !!getAccount();
  }

  function requireLogin(message = "Faça login ou cadastre-se para continuar.") {
    if (isLogged()) return true;

    alert(message);
    location.href = "login.html";
    return false;
  }

  function setupAccountStatus() {

    const account = getAccount();
    const logged = isLogged();

    document
      .querySelectorAll('a[href="login.html"], a[data-account-link="true"]')
      .forEach(link => {

        link.dataset.accountLink = "true";

        /* ESTADO LOGADO */
        if (logged && account) {

          link.href = "#";
          link.title = `Conta conectada: ${account.name || "Minha conta"} — clique para sair`;
          link.setAttribute(
            "aria-label",
            `Conta conectada: ${account.name || "Minha conta"}. Clique para sair.`
          );

          /* Mantém somente o ícone no cabeçalho para não quebrar o layout. */
          link.textContent = "♙";

          link.onclick = event => {

            event.preventDefault();

            const logout = confirm(
              `Conta conectada como ${account.name || "usuário"}.\n\nDeseja sair da conta?`
            );

            if (!logout) return;

            localStorage.removeItem("backstage_logged");

            /* Atualiza imediatamente o botão sem recarregar a página. */
            setupAccountStatus();

            alert("Você saiu da sua conta. 💜");
          };

        } else {

          /* ESTADO DESLOGADO */
          link.href = "login.html";
          link.title = "Minha conta";
          link.setAttribute("aria-label", "Minha conta");
          link.textContent = "♙";
          link.onclick = null;
        }
      });
  }

  function setupPurchaseProtection() {
    document
      .getElementById("buyNow")
      ?.addEventListener(
        "click",
        event => {
          if (!requireLogin("Faça login ou cadastre-se antes de comprar.")) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        },
        true
      );

    document
      .querySelectorAll('a[href="checkout.html"]')
      .forEach(link => {
        link.addEventListener(
          "click",
          event => {
            if (!requireLogin("Faça login ou cadastre-se antes de finalizar a compra.")) {
              event.preventDefault();
              event.stopImmediatePropagation();
            }
          },
          true
        );
      });
  }

  function setupAuth() {

    /* LOGIN */

    document
      .getElementById("loginForm")
      ?.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          const inputs = event.target.querySelectorAll("input");
          const email = inputs[0]?.value.trim().toLowerCase();
          const password = inputs[1]?.value || "";
          const account = getAccount();

          if (!account) {
            alert(
              "Nenhuma conta cadastrada foi encontrada. Faça seu cadastro primeiro."
            );
            return;
          }

          if (
            email !== String(account.email || "").trim().toLowerCase() ||
            password !== String(account.password || "")
          ) {
            alert(
              "E-mail ou senha incorretos. Confira seus dados e tente novamente."
            );
            return;
          }

          localStorage.setItem("backstage_logged", "1");

          alert(
            `Login realizado com sucesso! 💜\nBem-vinda, ${account.name || ""}!`
          );

          location.href = "index.html";
        }
      );

    /* CADASTRO */

    document
      .getElementById("registerForm")
      ?.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          const inputs = event.target.querySelectorAll("input");
          const name = inputs[0]?.value.trim() || "";
          const birthDate = inputs[1]?.value || "";
          const email = inputs[2]?.value.trim().toLowerCase() || "";
          const phone = inputs[3]?.value.trim() || "";
          const password = inputs[4]?.value || "";
          const confirmPassword = inputs[5]?.value || "";

          if (!name || !birthDate || !email || !password || !confirmPassword) {
            alert("Preencha todos os campos obrigatórios.");
            return;
          }

          if (password !== confirmPassword) {
            alert("As senhas não coincidem.");
            return;
          }

          const account = getAccount();

          if (
            account &&
            String(account.email || "").trim().toLowerCase() === email
          ) {
            alert(
              "Este e-mail já possui uma conta cadastrada. Faça login."
            );
            return;
          }

          localStorage.setItem(
            "backstage_account",
            JSON.stringify({
              name,
              birthDate,
              email,
              phone,
              password
            })
          );

          localStorage.setItem("backstage_logged", "1");

          alert("Conta criada com sucesso! 💜");

          location.href = "index.html";
        }
      );

    /* MOSTRAR / OCULTAR SENHA */

    document
      .querySelectorAll(".toggle-pass")
      .forEach(button => {

        button.onclick = () => {

          const input = button.previousElementSibling;

          if (!input) return;

          input.type =
            input.type === "password"
              ? "text"
              : "password";
        };
      });
  }


  /* =========================
     ACESSIBILIDADE
  ========================= */

function setupAccessibility() {

  const panel =
    document.getElementById("accessibilityPanel");

  const trigger =
    document.getElementById("accessibilityTrigger");

  if (
    !panel ||
    !trigger ||
    trigger.dataset.initialized
  ) {
    return;
  }

  trigger.dataset.initialized = "true";

  /* =========================
     CONFIGURAÇÃO DO MENU
  ========================= */

  trigger.setAttribute(
    "aria-expanded",
    "false"
  );

  trigger.setAttribute(
    "aria-controls",
    "accessibilityPanel"
  );

  trigger.setAttribute(
    "aria-label",
    "Abrir menu de acessibilidade"
  );

  panel.setAttribute(
    "role",
    "dialog"
  );

  panel.setAttribute(
    "aria-label",
    "Menu de acessibilidade"
  );


  const closePanel = () => {

    panel.classList.remove("open");

    trigger.setAttribute(
      "aria-expanded",
      "false"
    );

    trigger.setAttribute(
      "aria-label",
      "Abrir menu de acessibilidade"
    );

  };


  const openPanel = () => {

    panel.classList.add("open");

    trigger.setAttribute(
      "aria-expanded",
      "true"
    );

    trigger.setAttribute(
      "aria-label",
      "Fechar menu de acessibilidade"
    );

    const firstButton =
      panel.querySelector(
        "button:not(#closeAccessibility)"
      );

    firstButton?.focus();

  };


  /* =========================
     ABRIR / FECHAR
  ========================= */

  trigger.onclick = () => {

    if (panel.classList.contains("open")) {
      closePanel();
    } else {
      openPanel();
    }

  };


  document
    .getElementById("closeAccessibility")
    ?.addEventListener(
      "click",
      () => {

        closePanel();

        trigger.focus();

      }
    );


  /* Fechar com ESC */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        panel.classList.contains("open")
      ) {

        closePanel();

        trigger.focus();

      }

    }
  );


  /* Fechar ao clicar fora */

  document.addEventListener(
    "click",
    event => {

      if (
        !panel.classList.contains("open") ||
        panel.contains(event.target) ||
        trigger.contains(event.target)
      ) {
        return;
      }

      closePanel();

    }
  );


  /* =========================
     TAMANHO DA FONTE
  ========================= */

  const root =
    document.documentElement;

  let fontLevel =
    Number(
      localStorage.getItem(
        "backstage_font_level"
      ) || 0
    );


  const applyFont = () => {

    root.classList.remove(
      "font-size-1",
      "font-size-2",
      "font-size-3",
      "font-size-minus-1",
      "font-size-minus-2"
    );


    if (fontLevel > 0) {

      root.classList.add(
        `font-size-${fontLevel}`
      );

    }


    if (fontLevel < 0) {

      root.classList.add(
        `font-size-minus-${Math.abs(
          fontLevel
        )}`
      );

    }


    localStorage.setItem(
      "backstage_font_level",
      fontLevel
    );


    updateAccessibilityStatus();

  };


  /* =========================
     STATUS DO MENU
  ========================= */

  const status =
    document.createElement("div");

  status.className =
    "accessibility-status";

  status.setAttribute(
    "aria-live",
    "polite"
  );

  panel.appendChild(status);


  const updateAccessibilityStatus = () => {

    const contrastActive =
      document.body.classList.contains(
        "high-contrast"
      );


    let fontText =
      "Tamanho padrão";

    if (fontLevel > 0) {

      fontText =
        `Fonte aumentada em ${fontLevel} nível${
          fontLevel > 1 ? "is" : ""
        }`;

    }

    if (fontLevel < 0) {

      fontText =
        `Fonte reduzida em ${Math.abs(fontLevel)} nível${
          Math.abs(fontLevel) > 1 ? "is" : ""
        }`;

    }


    status.textContent =
      `${fontText}. Contraste ${
        contrastActive
          ? "ativado"
          : "normal"
      }.`;

  };


  applyFont();


  /* AUMENTAR FONTE */

  document
    .getElementById("increaseFont")
    ?.addEventListener(
      "click",
      () => {

        fontLevel =
          Math.min(
            3,
            fontLevel + 1
          );

        applyFont();

        toast(
          fontLevel >= 3
            ? "Tamanho máximo da fonte."
            : "Fonte aumentada."
        );

      }
    );


  /* DIMINUIR FONTE */

  document
    .getElementById("decreaseFont")
    ?.addEventListener(
      "click",
      () => {

        fontLevel =
          Math.max(
            -2,
            fontLevel - 1
          );

        applyFont();

        toast(
          fontLevel <= -2
            ? "Tamanho mínimo da fonte."
            : "Fonte diminuída."
        );

      }
    );


  /* =========================
     ALTO CONTRASTE
  ========================= */

  const contrastButton =
    document.getElementById("contrast");


  const savedContrast =
    localStorage.getItem(
      "backstage_high_contrast"
    ) === "1";


  if (savedContrast) {

    document.body.classList.add(
      "high-contrast"
    );

  }


  const updateContrastButton = () => {

    if (!contrastButton) return;

    const active =
      document.body.classList.contains(
        "high-contrast"
      );

    contrastButton.setAttribute(
      "aria-pressed",
      active ? "true" : "false"
    );

    contrastButton.textContent =
      active
        ? "◐ Alto contraste: ativado"
        : "◐ Alto contraste";

  };


  contrastButton?.addEventListener(
    "click",
    () => {

      const active =
        document.body.classList.toggle(
          "high-contrast"
        );


      localStorage.setItem(
        "backstage_high_contrast",
        active ? "1" : "0"
      );


      updateContrastButton();
      updateAccessibilityStatus();

    }
  );


  updateContrastButton();


  /* =========================
     LEITOR DE PÁGINA
  ========================= */

  const readButton =
    document.getElementById("readPage");


  const stopButton =
    document.getElementById("stopReading");


  readButton?.addEventListener(
    "click",
    () => {

      window.speechSynthesis?.cancel();


      const text =
        document.querySelector(
          "main"
        )?.innerText || "";


      if (
        text &&
        window.speechSynthesis
      ) {

        const utterance =
          new SpeechSynthesisUtterance(
            text.slice(0, 3000)
          );


        utterance.lang =
          "pt-BR";


        window.speechSynthesis.speak(
          utterance
        );


        readButton.setAttribute(
          "aria-pressed",
          "true"
        );


        readButton.textContent =
          "🔊 Leitura em andamento";

      } else {

        toast(
          "Não foi possível iniciar a leitura."
        );

      }

    }
  );


  stopButton?.addEventListener(
    "click",
    () => {

      window.speechSynthesis?.cancel();


      if (readButton) {

        readButton.setAttribute(
          "aria-pressed",
          "false"
        );

        readButton.textContent =
          "🔊 Ler página";

      }

      toast(
        "Leitura interrompida."
      );

    }
  );


  if (readButton) {

    readButton.setAttribute(
      "aria-pressed",
      "false"
    );

  }


  updateAccessibilityStatus();

}

  /* =========================
     FOOTER
  ========================= */

function footer() {
  const footer = document.querySelector(".footer-main");

  if (!footer || footer.dataset.initialized) {
    return;
  }

  footer.dataset.initialized = "true";

  const socials = footer.querySelector(".socials");

  if (!socials) {
    return;
  }

  socials.innerHTML = `
    <a
      href="https://www.instagram.com/backstagemodafeminina"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      title="Instagram"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5"></rect>
        <circle cx="12" cy="12" r="4"></circle>
        <circle cx="17.5" cy="6.5" r="1"></circle>
      </svg>
    </a>

    <a
      href="https://wa.me/5500000000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      title="WhatsApp"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20.5 11.1a8.5 8.5 0 0 1-12.6 7.4L4 20l1.5-3.7A8.5 8.5 0 1 1 20.5 11.1Z"></path>
        <path d="M8.5 8.5c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4-.1.6l-.6.7c.7 1.2 1.7 2.1 2.9 2.7l.7-.7c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.3.6-.2.8-.8 1.4-1.5 1.6-1.1.3-3.2-.6-4.8-2.1-1.5-1.4-2.5-3.4-2.4-4.6.1-.5.4-.8.9-1Z"></path>
      </svg>
    </a>

    <a
      href="https://www.tiktok.com/@backstagemodafeminina"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="TikTok"
      title="TikTok"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M15.5 3c.3 1.8 1.3 3.2 3.1 4v3.1c-1.3-.1-2.5-.5-3.6-1.2v6.2c0 3.4-2.4 5.9-5.8 5.9-3.1 0-5.4-2.2-5.4-5.2 0-3.1 2.5-5.4 5.7-5.4.4 0 .8 0 1.1.1v3.2c-.3-.1-.7-.2-1.1-.2-1.4 0-2.5.9-2.5 2.3 0 1.3 1 2.1 2.2 2.1 1.4 0 2.4-.9 2.4-2.7V3h3.9Z"></path>
      </svg>
    </a>
  `;
}

  /* =========================
     MENU ATIVO
  ========================= */

  function setupActiveNav() {

    const nav =
      document.querySelector(".nav");

    if (!nav) return;

    const params =
      new URLSearchParams(
        location.search
      );

    const page =
      location.pathname
        .split("/")
        .pop() || "index.html";

    let active = "";

    if (
      page === "index.html" ||
      page === ""
    ) {
      active = "novidades";
    }

    if (page === "produtos.html") {

      if (
        params.get("promocao") ===
        "true"
      ) {

        active = "promocoes";

      } else {

        const category =
          params.get(
            "categoria"
          ) || "";

        const map = {
          "Blusas": "blusas",
          "Calças": "calcas",
          "Shorts": "shorts",
          "Vestidos": "vestidos",
          "Infantis": "infantis"
        };

        active =
          map[category] || "";
      }
    }

    if (page === "produto.html") {

      const product =
        PRODUCTS.find(
          item =>
            item.id ===
            Number(
              params.get("id")
            )
        );

      const map = {
        "Blusas": "blusas",
        "Calças": "calcas",
        "Shorts": "shorts",
        "Vestidos": "vestidos",
        "Infantis": "infantis"
      };

      active =
        product
          ? map[product.category] || ""
          : "";
    }

    nav
      .querySelectorAll(
        "a[data-nav]"
      )
      .forEach(link => {

        link.classList.toggle(
          "active",
          link.dataset.nav === active
        );

      });
  }

  /* =========================
     SLIDER DA HOME
  ========================= */

  function setupHero() {

    const hero =
      document.getElementById(
        "heroSlider"
      );

    if (
      !hero ||
      hero.dataset.initialized
    ) {
      return;
    }

    hero.dataset.initialized =
      "true";

    const slides = [
      {
        image:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=85",
        eyebrow:
          "NOVA COLEÇÃO",
        title:
          "Seu estilo.<br><em>Sua história.</em>",
        text:
          "Peças femininas para todos os momentos, com personalidade e conforto.",
        link:
          "produtos.html"
      },

      {
        image:
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=85",
        eyebrow:
          "PRIMAVERA 2026",
        title:
          "Leveza para<br><em>todos os dias.</em>",
        text:
          "Descubra peças que deixam sua rotina ainda mais especial.",
        link:
          "produtos.html"
      },

      {
        image:
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85",
        eyebrow:
          "BACKSTAGE",
        title:
          "Vista sua<br><em>personalidade.</em>",
        text:
          "Encontre seu próximo look favorito na nossa coleção.",
        link:
          "produtos.html"
      }
    ];

    let current = 0;
    let timer;

    const render = index => {

      current =
        (
          index +
          slides.length
        ) %
        slides.length;

      const slide =
        slides[current];

      hero.style.backgroundImage =
        `linear-gradient(
          90deg,
          #201b20aa,
          #201b2000
        ),
        url("${slide.image}")`;

      document
        .getElementById(
          "heroEyebrow"
        )
        ?.replaceChildren(
          document.createTextNode(
            slide.eyebrow
          )
        );

      const title =
        document.getElementById(
          "heroTitle"
        );

      if (title) {
        title.innerHTML =
          slide.title;
      }

      const text =
        document.getElementById(
          "heroText"
        );

      if (text) {
        text.textContent =
          slide.text;
      }

      const link =
        document.getElementById(
          "heroLink"
        );

      if (link) {
        link.href =
          slide.link;
      }

      document
        .querySelectorAll(
          "#heroDots .dot"
        )
        .forEach(
          (dot, index) =>
            dot.classList.toggle(
              "active",
              index === current
            )
        );
    };

    const restart = () => {

      clearInterval(timer);

      timer = setInterval(
        () =>
          render(
            current + 1
          ),
        6000
      );
    };

    document
      .getElementById("heroNext")
      ?.addEventListener(
        "click",
        () => {

          render(
            current + 1
          );

          restart();
        }
      );

    document
      .getElementById("heroPrev")
      ?.addEventListener(
        "click",
        () => {

          render(
            current - 1
          );

          restart();
        }
      );

    document
      .querySelectorAll(
        "#heroDots .dot"
      )
      .forEach(dot => {

        dot.addEventListener(
          "click",
          () => {

            render(
              Number(
                dot.dataset.slide
              )
            );

            restart();
          }
        );

      });

    render(0);
    restart();
  }

  /* =========================
     INICIALIZAÇÃO
  ========================= */

  renderHome();
  renderProducts();
  renderProductDetail();
  renderCart();
  renderWishlist();
  renderCheckout();
  setupAuth();
  setupAccountStatus();
  setupPurchaseProtection();
  setupAccessibility();
  setupActiveNav();
  setupHero();
  footer();
  updateCartCount();

});