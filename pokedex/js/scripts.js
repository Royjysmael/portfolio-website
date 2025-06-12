// === Pokémon Repository IIFE ===
const pokemonRepository = (function () {
  const pokemonList = [];

  // === Add Pokémon ===
  function add(pokemon) {
    pokemonList.push(pokemon);
  }

  // === Get All Pokémon ===
  function getAll() {
    return pokemonList;
  }

  // === Capitalize Helper ===
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // === Add List Item to Card Layout ===
  function addListItem(pokemon) {
    const listGroup = document.querySelector(".pokemon-list");

    const col = document.createElement("div");
    col.classList.add("col-12", "col-sm-6", "col-md-4", "col-lg-3");

    const card = document.createElement("div");
    card.classList.add("card", "h-100", "shadow-sm");

    const img = document.createElement("img");
    img.src = pokemon.imageUrl;
    img.alt = `${pokemon.name} image`;
    img.classList.add("card-img-top", "p-3");

    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body", "text-center");

    const title = document.createElement("h5");
    title.classList.add("card-title");
    title.innerText = `#${pokemon.number
      .toString()
      .padStart(3, "0")} ${capitalize(pokemon.name)}`;

    const typeContainer = document.createElement("div");
    typeContainer.classList.add("mb-2");

    cardBody.appendChild(title);
    cardBody.appendChild(typeContainer);
    card.appendChild(img);
    card.appendChild(cardBody);
    col.appendChild(card);
    listGroup.appendChild(col);

    if (pokemon.types && pokemon.types.length > 0) {
      pokemon.types.forEach((type) => {
        const badge = document.createElement("span");
        badge.innerText = capitalize(type);
        badge.classList.add("type-badge", `type-${type.toLowerCase()}`);
        typeContainer.appendChild(badge);
      });
    }

    card.addEventListener("click", function () {
      showDetails(pokemon);
    });
  }

  // === Show Details ===
  function showDetails(pokemon) {
    loadDetails(pokemon).then(function () {
      showModal(pokemon);
      const modalElement = document.getElementById("pokemonModal");
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    });
  }

  // === Load Pokémon List ===
  function loadList() {
    showLoadingMessage();
    return fetch("https://pokeapi.co/api/v2/pokemon/?limit=151")
      .then((response) => response.json())
      .then((json) => {
        hideLoadingMessage();
        json.results.forEach((item) => {
          const pokemon = {
            name: item.name,
            detailsUrl: item.url,
            number: parseInt(item.url.split("/").filter(Boolean).pop()),
          };
          add(pokemon);
        });
      })
      .catch((e) => {
        hideLoadingMessage();
        console.error("Error loading Pokémon list:", e);
      });
  }

  // === Load Details ===
  function loadDetails(pokemon) {
    showLoadingMessage();
    return fetch(pokemon.detailsUrl)
      .then((response) => response.json())
      .then((details) => {
        hideLoadingMessage();

        pokemon.number = details.id;

        pokemon.imageUrl = details.sprites.front_default || "img/fallback.png";
        pokemon.height = details.height;
        pokemon.weight = details.weight;
        pokemon.types = (details.types || []).map((type) => type.type.name);
        pokemon.stats = details.stats.map((stat) => ({
          name: stat.stat.name,
          value: stat.base_stat,
        }));

        if (!details.species || !details.species.url) {
          console.error("Missing species data for:", pokemon.name);
          pokemon.description = "No species description available.";
          return;
        }

        return fetch(details.species.url)
          .then((res) => res.json())
          .then((speciesData) => {
            const entry = speciesData.flavor_text_entries.find(
              (entry) => entry.language.name === "en"
            );
            pokemon.description = entry
              ? entry.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ")
              : "No description available.";
          });
      })
      .catch((e) => {
        hideLoadingMessage();
        console.error("Error loading details for:", pokemon.name, e);
      });
  }

  // === Show Modal ===
  function showModal(pokemon) {
    const modalTitle = document.querySelector("#pokemonModalLabel");
    const modalDescription = document.querySelector(".modal-description");
    const modalHeight = document.querySelector(".modal-height");
    const modalWeight = document.querySelector(".modal-weight");
    const modalTypes = document.querySelector(".modal-types");
    const modalImage = document.querySelector(".modal-image");
    const modalStatsList = document.querySelector(".modal-stats-list");

    modalTitle.innerText = capitalize(pokemon.name);
    modalDescription.innerText =
      pokemon.description || "No description available.";
    modalHeight.innerText = `Height: ${pokemon.height}`;
    modalWeight.innerText = `Weight: ${pokemon.weight}`;
    modalImage.src = pokemon.imageUrl;
    modalImage.alt = pokemon.name;

    modalTypes.innerHTML = "";
    pokemon.types.forEach((type) => {
      const badge = document.createElement("span");
      badge.innerText = capitalize(type);
      badge.classList.add("type-badge", `type-${type.toLowerCase()}`);
      modalTypes.appendChild(badge);
    });

    modalStatsList.innerHTML = "";
    pokemon.stats.forEach((stat) => {
      const statItem = document.createElement("li");
      statItem.innerText = `${stat.name}: ${stat.value}`;
      modalStatsList.appendChild(statItem);
    });
  }

  // === Show Loading Message ===
  function showLoadingMessage() {
    const loadingMessage = document.createElement("p");
    loadingMessage.innerText = "Loading Pokémon...";
    loadingMessage.classList.add("loading-message");
    document.body.appendChild(loadingMessage);
  }

  // === Hide Loading Message ===
  function hideLoadingMessage() {
    const loadingMessage = document.querySelector(".loading-message");
    if (loadingMessage) {
      loadingMessage.remove();
    }
  }

  // Return everything
  return {
    add,
    getAll,
    addListItem,
    loadList,
    loadDetails,
  };
})();

function renderPokemonList(list = pokemonRepository.getAll()) {
  const listGroup = document.querySelector(".pokemon-list");
  const noResultsMessage = document.querySelector(".no-results");
  listGroup.innerHTML = "";

  // Show or hide "No results" message
  if (list.length === 0) {
    noResultsMessage.style.display = "block";
    return;
  } else {
    noResultsMessage.style.display = "none";
  }

  // Load all details first
  const promises = list.map((pokemon) =>
    pokemonRepository.loadDetails(pokemon)
  );

  Promise.all(promises).then(() => {
    // Sort by Pokémon number
    list.sort((a, b) => a.number - b.number);

    // DOM in correct order
    list.forEach((pokemon) => {
      pokemonRepository.addListItem(pokemon);
    });
  });
}

// === Enhanced Search Filter ===
document.getElementById("searchInput").addEventListener("input", function (e) {
  const query = e.target.value.toLowerCase();

  const filtered = pokemonRepository.getAll().filter((pokemon) => {
    const nameMatch = pokemon.name.toLowerCase().includes(query);
    const numberMatch = pokemon.number
      ?.toString()
      .padStart(3, "0")
      .includes(query);
    const typeMatch =
      Array.isArray(pokemon.types) &&
      pokemon.types.some((type) => type.toLowerCase().includes(query));

    return nameMatch || numberMatch || typeMatch;
  });

  renderPokemonList(filtered);
});

// === Initial load and render ===
pokemonRepository.loadList().then(() => {
  renderPokemonList();
});
